import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler, generateCode } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/orders',
  requirePermission('purchase', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name), warehouses(name)')
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/orders',
  requirePermission('purchase', 'create'),
  asyncHandler(async (req, res) => {
    const { supplier_id, warehouse_id, items = [] } = req.body;
    const po_number = generateCode('PO');
    const total_amount_minor = items.reduce((s, i) => s + i.unit_cost_minor * i.quantity, 0);

    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({ company_id: req.user.company_id, po_number, supplier_id, warehouse_id, total_amount_minor, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;

    if (items.length) {
      await supabase
        .from('purchase_order_items')
        .insert(items.map((i) => ({ purchase_order_id: po.id, product_id: i.product_id, quantity: i.quantity, unit_cost_minor: i.unit_cost_minor })));
    }
    res.status(201).json({ data: po });
  })
);

router.get(
  '/orders/:id',
  requirePermission('purchase', 'view'),
  asyncHandler(async (req, res) => {
    const [po, items] = await Promise.all([
      supabase.from('purchase_orders').select('*, suppliers(name), warehouses(name)').eq('id', req.params.id).single(),
      supabase.from('purchase_order_items').select('*, products(name, sku)').eq('purchase_order_id', req.params.id),
    ]);
    if (po.error) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ order: po.data, items: items.data || [] });
  })
);

router.post(
  '/orders/:id/approve',
  requirePermission('purchase', 'approve'),
  asyncHandler(async (req, res) => {
    const { data: po } = await supabase.from('purchase_orders').select('status').eq('id', req.params.id).single();
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status !== 'pending') return res.status(400).json({ error: `Cannot approve a PO with status "${po.status}"` });
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'approved' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/orders/:id/reject',
  requirePermission('purchase', 'approve'),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const { data: po } = await supabase.from('purchase_orders').select('status').eq('id', req.params.id).single();
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status !== 'pending') return res.status(400).json({ error: `Cannot reject a PO with status "${po.status}"` });
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'rejected', rejection_reason: reason || null })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  })
);

// Receive stock against a PO -> creates a Purchase (invoice) and increments inventory
router.post(
  '/receive',
  requirePermission('purchase', 'edit'),
  asyncHandler(async (req, res) => {
    const { purchase_order_id, supplier_id, warehouse_id, items = [] } = req.body;
    if (!warehouse_id || !items.length) {
      return res.status(400).json({ error: 'warehouse_id and at least one line item are required' });
    }

    if (purchase_order_id) {
      const { data: po } = await supabase.from('purchase_orders').select('status').eq('id', purchase_order_id).single();
      if (po && po.status === 'pending') {
        return res.status(409).json({ error: 'This purchase order is still pending approval' });
      }
      if (po && po.status === 'rejected') {
        return res.status(409).json({ error: 'This purchase order was rejected and cannot be received' });
      }
    }

    const subtotal_minor = items.reduce((s, i) => s + i.unit_cost_minor * i.quantity, 0);
    const purchase_no = generateCode('PUR');

    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        company_id: req.user.company_id,
        purchase_no,
        purchase_order_id,
        supplier_id,
        warehouse_id,
        subtotal_minor,
        total_minor: subtotal_minor,
        status: 'unpaid',
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) throw error;

    const rows = items.map((i) => ({
      purchase_id: purchase.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_cost_minor: i.unit_cost_minor,
      line_total_minor: i.unit_cost_minor * i.quantity,
    }));
    await supabase.from('purchase_items').insert(rows);

    for (const item of items) {
      const { data: stockRow } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouse_id)
        .maybeSingle();
      const qty_before = stockRow?.quantity ?? 0;
      const qty_after = Number(qty_before) + Number(item.quantity);
      if (stockRow) {
        await supabase.from('stock').update({ quantity: qty_after }).eq('id', stockRow.id);
      } else {
        await supabase.from('stock').insert({ product_id: item.product_id, warehouse_id, quantity: qty_after });
      }
      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        warehouse_id,
        move_type: 'in',
        quantity: item.quantity,
        qty_before,
        qty_after,
        reference_type: 'purchase',
        reference_id: purchase.id,
        created_by: req.user.id,
      });
    }

    if (supplier_id) {
      const { data: supplier } = await supabase.from('suppliers').select('current_balance_minor').eq('id', supplier_id).single();
      const balance_after = (supplier?.current_balance_minor || 0) + subtotal_minor;
      await supabase.from('suppliers').update({ current_balance_minor: balance_after }).eq('id', supplier_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'supplier',
        party_id: supplier_id,
        entry_type: 'credit',
        amount_minor: subtotal_minor,
        balance_after_minor: balance_after,
        reference_type: 'purchase',
        reference_id: purchase.id,
        description: `Purchase ${purchase_no}`,
      });
    }

    res.status(201).json({ data: purchase });
  })
);

router.get(
  '/',
  requirePermission('purchase', 'view'),
  asyncHandler(async (req, res) => {
    let query = supabase
      .from('purchases')
      .select('*, suppliers(name), warehouses(name)', { count: 'exact' })
      .eq('company_id', req.user.company_id);
    const { supplier_id, status, from, to, page, page_size = 25 } = req.query;
    if (supplier_id) query = query.eq('supplier_id', supplier_id);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    query = query.order('created_at', { ascending: false });
    if (page) {
      const start = (Number(page) - 1) * Number(page_size);
      query = query.range(start, start + Number(page_size) - 1);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: page ? Number(page) : undefined, page_size: Number(page_size) });
  })
);

export default router;
