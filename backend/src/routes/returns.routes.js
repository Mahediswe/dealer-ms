import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// ---------- SALES RETURN ----------
router.get(
  '/sales',
  requirePermission('sales', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('sales_returns')
      .select('*, products(name, sku), sales(invoice_no, dealer_id)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/sales',
  requirePermission('sales', 'edit'),
  asyncHandler(async (req, res) => {
    const { sale_id, product_id, quantity, reason = 'other', restock = true } = req.body;
    if (!sale_id || !product_id || !quantity) {
      return res.status(400).json({ error: 'sale_id, product_id and quantity are required' });
    }

    const [{ data: sale, error: saleErr }, { data: item }] = await Promise.all([
      supabase.from('sales').select('*').eq('id', sale_id).single(),
      supabase.from('sale_items').select('*').eq('sale_id', sale_id).eq('product_id', product_id).maybeSingle(),
    ]);
    if (saleErr || !sale) return res.status(404).json({ error: 'Sale not found' });
    if (!item) return res.status(404).json({ error: 'This product is not on the selected invoice' });
    if (quantity > item.quantity) return res.status(400).json({ error: 'Return quantity exceeds sold quantity' });

    const unitPrice = item.unit_price_minor;
    const amount_minor = unitPrice * quantity;

    const { data: ret, error } = await supabase
      .from('sales_returns')
      .insert({ sale_id, product_id, quantity, reason, amount_minor })
      .select()
      .single();
    if (error) throw error;

    if (restock) {
      const { data: stockRow } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', product_id)
        .eq('warehouse_id', sale.warehouse_id)
        .maybeSingle();
      const qty_before = stockRow?.quantity ?? 0;
      const qty_after = Number(qty_before) + Number(quantity);
      if (stockRow) {
        await supabase.from('stock').update({ quantity: qty_after }).eq('id', stockRow.id);
      } else {
        await supabase.from('stock').insert({ product_id, warehouse_id: sale.warehouse_id, quantity: qty_after });
      }
      await supabase.from('stock_movements').insert({
        product_id,
        warehouse_id: sale.warehouse_id,
        move_type: 'in',
        quantity,
        qty_before,
        qty_after,
        reference_type: 'sales_return',
        reference_id: ret.id,
        reason: `Return: ${reason}`,
        created_by: req.user.id,
      });
    }

    if (sale.dealer_id) {
      const { data: dealer } = await supabase.from('dealers').select('current_balance_minor').eq('id', sale.dealer_id).single();
      const balance_after = (dealer?.current_balance_minor || 0) - amount_minor;
      await supabase.from('dealers').update({ current_balance_minor: balance_after }).eq('id', sale.dealer_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'dealer',
        party_id: sale.dealer_id,
        entry_type: 'credit',
        amount_minor,
        balance_after_minor: balance_after,
        reference_type: 'sales_return',
        reference_id: ret.id,
        description: `Return against invoice ${sale.invoice_no}`,
      });
    }

    res.status(201).json({ data: ret });
  })
);

// ---------- PURCHASE RETURN ----------
router.get(
  '/purchases',
  requirePermission('purchase', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('purchase_returns')
      .select('*, products(name, sku), purchases(purchase_no, supplier_id)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/purchases',
  requirePermission('purchase', 'edit'),
  asyncHandler(async (req, res) => {
    const { purchase_id, product_id, quantity, reason = 'other' } = req.body;
    if (!purchase_id || !product_id || !quantity) {
      return res.status(400).json({ error: 'purchase_id, product_id and quantity are required' });
    }

    const [{ data: purchase, error: purErr }, { data: item }] = await Promise.all([
      supabase.from('purchases').select('*').eq('id', purchase_id).single(),
      supabase.from('purchase_items').select('*').eq('purchase_id', purchase_id).eq('product_id', product_id).maybeSingle(),
    ]);
    if (purErr || !purchase) return res.status(404).json({ error: 'Purchase not found' });
    if (!item) return res.status(404).json({ error: 'This product is not on the selected purchase' });

    const amount_minor = item.unit_cost_minor * quantity;

    const { data: stockRow } = await supabase
      .from('stock')
      .select('*')
      .eq('product_id', product_id)
      .eq('warehouse_id', purchase.warehouse_id)
      .maybeSingle();
    if (!stockRow || stockRow.quantity < quantity) {
      return res.status(409).json({ error: 'Insufficient stock on hand to process this return' });
    }

    const qty_after = Number(stockRow.quantity) - Number(quantity);
    await supabase.from('stock').update({ quantity: qty_after }).eq('id', stockRow.id);

    const { data: ret, error } = await supabase
      .from('purchase_returns')
      .insert({ purchase_id, product_id, quantity, reason, amount_minor })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('stock_movements').insert({
      product_id,
      warehouse_id: purchase.warehouse_id,
      move_type: 'out',
      quantity,
      qty_before: stockRow.quantity,
      qty_after,
      reference_type: 'purchase_return',
      reference_id: ret.id,
      reason: `Return to supplier: ${reason}`,
      created_by: req.user.id,
    });

    if (purchase.supplier_id) {
      const { data: supplier } = await supabase.from('suppliers').select('current_balance_minor').eq('id', purchase.supplier_id).single();
      const balance_after = (supplier?.current_balance_minor || 0) - amount_minor;
      await supabase.from('suppliers').update({ current_balance_minor: balance_after }).eq('id', purchase.supplier_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'supplier',
        party_id: purchase.supplier_id,
        entry_type: 'debit',
        amount_minor,
        balance_after_minor: balance_after,
        reference_type: 'purchase_return',
        reference_id: ret.id,
        description: `Return against purchase ${purchase.purchase_no}`,
      });
    }

    res.status(201).json({ data: ret });
  })
);

export default router;
