import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler, generateCode } from '../utils/helpers.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('sales', 'view'),
  asyncHandler(async (req, res) => {
    let query = supabase
      .from('sales')
      .select('*, dealers(name, dealer_code), warehouses(name)', { count: 'exact' })
      .eq('company_id', req.user.company_id);
    const { status, dealer_id, from, to, page, page_size = 25 } = req.query;
    if (status) query = query.eq('status', status);
    if (dealer_id) query = query.eq('dealer_id', dealer_id);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    query = query.order('created_at', { ascending: false });
    if (page) {
      const start = (Number(page) - 1) * Number(page_size);
      query = query.range(start, start + Number(page_size) - 1);
    } else {
      query = query.limit(500);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: page ? Number(page) : undefined, page_size: Number(page_size) });
  })
);

router.get(
  '/:id',
  requirePermission('sales', 'view'),
  asyncHandler(async (req, res) => {
    const [sale, items] = await Promise.all([
      supabase.from('sales').select('*, dealers(name, phone), warehouses(name)').eq('id', req.params.id).single(),
      supabase.from('sale_items').select('*, products(name, sku)').eq('sale_id', req.params.id),
    ]);
    if (sale.error) return res.status(404).json({ error: 'Sale not found' });
    res.json({ sale: sale.data, items: items.data || [] });
  })
);

// Create a sale: validates credit limit + stock, decrements inventory,
// posts a dealer ledger entry — all in one request (wrapped best-effort;
// for full ACID guarantees call this via a Postgres RPC/transaction).
router.post(
  '/',
  requirePermission('sales', 'create'),
  asyncHandler(async (req, res) => {
    const { dealer_id, warehouse_id, sale_type = 'credit', items = [], discount_minor = 0, tax_minor = 0 } = req.body;
    if (!warehouse_id || !items.length) {
      return res.status(400).json({ error: 'warehouse_id and at least one line item are required' });
    }

    // Stock availability check
    for (const item of items) {
      const { data: stockRow } = await supabase
        .from('stock')
        .select('quantity')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouse_id)
        .maybeSingle();
      const available = stockRow?.quantity ?? 0;
      if (available < item.quantity) {
        return res.status(409).json({ error: `Insufficient stock for one of the selected products` });
      }
    }

    const subtotal_minor = items.reduce((sum, i) => sum + i.unit_price_minor * i.quantity, 0);
    const total_minor = subtotal_minor - discount_minor + tax_minor;

    // Credit limit check
    if (dealer_id && sale_type === 'credit') {
      const { data: dealer } = await supabase
        .from('dealers')
        .select('credit_limit_minor, current_balance_minor')
        .eq('id', dealer_id)
        .single();
      if (dealer && dealer.credit_limit_minor > 0) {
        const projected = dealer.current_balance_minor + total_minor;
        if (projected > dealer.credit_limit_minor && !['admin', 'super_admin', 'manager'].includes(req.user.role)) {
          return res.status(409).json({ error: 'This sale would exceed the dealer\u2019s credit limit' });
        }
      }
    }

    const invoice_no = generateCode('INV');
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        company_id: req.user.company_id,
        branch_id: req.user.branch_id,
        invoice_no,
        dealer_id,
        warehouse_id,
        salesman_id: req.user.role === 'salesman' ? req.user.id : req.body.salesman_id,
        sale_type,
        subtotal_minor,
        discount_minor,
        tax_minor,
        total_minor,
        status: 'invoiced',
        created_by: req.user.id,
      })
      .select()
      .single();
    if (saleErr) throw saleErr;

    const rows = items.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_minor: i.unit_price_minor,
      discount_minor: i.discount_minor || 0,
      tax_minor: i.tax_minor || 0,
      line_total_minor: i.unit_price_minor * i.quantity - (i.discount_minor || 0) + (i.tax_minor || 0),
    }));
    const { error: itemsErr } = await supabase.from('sale_items').insert(rows);
    if (itemsErr) throw itemsErr;

    // Decrement stock + log movement per item
    const io = req.app.get('io');
    for (const item of items) {
      const { data: stockRow } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', warehouse_id)
        .single();
      const qty_after = stockRow.quantity - item.quantity;
      await supabase.from('stock').update({ quantity: qty_after }).eq('id', stockRow.id);
      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        warehouse_id,
        move_type: 'out',
        quantity: item.quantity,
        qty_before: stockRow.quantity,
        qty_after,
        reference_type: 'sale',
        reference_id: sale.id,
        created_by: req.user.id,
      });

      // Fire a low-stock alert the moment a sale pushes a product at/below its threshold
      const { data: product } = await supabase.from('products').select('name, min_stock').eq('id', item.product_id).single();
      if (product && qty_after <= (product.min_stock ?? 0)) {
        notify(io, {
          companyId: req.user.company_id,
          type: 'low_stock',
          title: `Low stock: ${product.name}`,
          message: `Only ${qty_after} left after invoice ${invoice_no}.`,
        });
      }
    }

    // Post dealer ledger entry (debit = dealer owes more)
    if (dealer_id) {
      const { data: dealer } = await supabase.from('dealers').select('current_balance_minor, credit_limit_minor, name').eq('id', dealer_id).single();
      const balance_after = (dealer?.current_balance_minor || 0) + total_minor;
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'dealer',
        party_id: dealer_id,
        entry_type: 'debit',
        amount_minor: total_minor,
        balance_after_minor: balance_after,
        reference_type: 'sale',
        reference_id: sale.id,
        description: `Invoice ${invoice_no}`,
      });
      await supabase.from('dealers').update({ current_balance_minor: balance_after }).eq('id', dealer_id);

      if (dealer?.credit_limit_minor > 0 && balance_after >= dealer.credit_limit_minor * 0.8) {
        notify(io, {
          companyId: req.user.company_id,
          type: 'credit_limit',
          title: `${dealer.name} is near their credit limit`,
          message: `${(balance_after / 100).toLocaleString()} of ${(dealer.credit_limit_minor / 100).toLocaleString()} BDT used.`,
        });
      }
    }

    res.status(201).json({ data: sale });
  })
);

router.post(
  '/:id/cancel',
  requirePermission('sales', 'approve'),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'A cancellation reason is required' });

    const { data: sale, error } = await supabase.from('sales').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status === 'cancelled') return res.status(400).json({ error: 'Sale already cancelled' });

    const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id);
    for (const item of items || []) {
      const { data: stockRow } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', sale.warehouse_id)
        .maybeSingle();
      if (stockRow) {
        await supabase
          .from('stock')
          .update({ quantity: Number(stockRow.quantity) + Number(item.quantity) })
          .eq('id', stockRow.id);
      }
    }

    if (sale.dealer_id) {
      const { data: dealer } = await supabase.from('dealers').select('current_balance_minor').eq('id', sale.dealer_id).single();
      const balance_after = (dealer?.current_balance_minor || 0) - sale.total_minor;
      await supabase.from('dealers').update({ current_balance_minor: balance_after }).eq('id', sale.dealer_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'dealer',
        party_id: sale.dealer_id,
        entry_type: 'credit',
        amount_minor: sale.total_minor,
        balance_after_minor: balance_after,
        reference_type: 'sale_cancel',
        reference_id: sale.id,
        description: `Cancelled invoice ${sale.invoice_no}: ${reason}`,
      });
    }

    const { data, error: cancelErr } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', sale.id)
      .select()
      .single();
    if (cancelErr) throw cancelErr;
    res.json({ data });
  })
);

export default router;
