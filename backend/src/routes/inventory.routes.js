import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

async function getOrCreateStockRow(product_id, warehouse_id) {
  const { data: existing } = await supabase
    .from('stock')
    .select('*')
    .eq('product_id', product_id)
    .eq('warehouse_id', warehouse_id)
    .maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await supabase
    .from('stock')
    .insert({ product_id, warehouse_id, quantity: 0 })
    .select()
    .single();
  if (error) throw error;
  return created;
}

router.get(
  '/stock',
  requirePermission('inventory', 'view'),
  asyncHandler(async (req, res) => {
    const { warehouse_id, low_stock } = req.query;
    let query = supabase.from('stock').select('*, products(name, sku, min_stock, image_url), warehouses(name)');
    if (warehouse_id) query = query.eq('warehouse_id', warehouse_id);
    const { data, error } = await query;
    if (error) throw error;
    const rows = low_stock === 'true' ? data.filter((r) => r.quantity <= (r.products?.min_stock ?? 0)) : data;
    res.json({ data: rows });
  })
);

router.get(
  '/movements',
  requirePermission('inventory', 'view'),
  asyncHandler(async (req, res) => {
    const { product_id } = req.query;
    let query = supabase
      .from('stock_movements')
      .select('*, products(name, sku), warehouses(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (product_id) query = query.eq('product_id', product_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  })
);

// Stock In / Out / Adjustment
router.post(
  '/movements',
  requirePermission('inventory', 'edit'),
  asyncHandler(async (req, res) => {
    const { product_id, warehouse_id, move_type, quantity, reason } = req.body;
    if (!product_id || !warehouse_id || !move_type || !quantity) {
      return res.status(400).json({ error: 'product_id, warehouse_id, move_type and quantity are required' });
    }

    const row = await getOrCreateStockRow(product_id, warehouse_id);
    const qty_before = Number(row.quantity);
    let qty_after = qty_before;

    if (move_type === 'in' || move_type === 'adjustment') qty_after = qty_before + Number(quantity);
    else if (move_type === 'out' || move_type === 'damaged' || move_type === 'expired') {
      if (qty_before < Number(quantity)) {
        return res.status(409).json({ error: 'Insufficient stock for this operation' });
      }
      qty_after = qty_before - Number(quantity);
    }

    const { error: updateErr } = await supabase.from('stock').update({ quantity: qty_after }).eq('id', row.id);
    if (updateErr) throw updateErr;

    const { data: movement, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        warehouse_id,
        move_type,
        quantity,
        qty_before,
        qty_after,
        reason,
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ data: movement });
  })
);

// Warehouse-to-warehouse transfer
router.post(
  '/transfer',
  requirePermission('inventory', 'edit'),
  asyncHandler(async (req, res) => {
    const { product_id, from_warehouse_id, to_warehouse_id, quantity, reason } = req.body;
    if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
      return res.status(400).json({ error: 'product_id, from_warehouse_id, to_warehouse_id and quantity are required' });
    }
    if (from_warehouse_id === to_warehouse_id) {
      return res.status(400).json({ error: 'Source and destination warehouse must differ' });
    }

    const fromRow = await getOrCreateStockRow(product_id, from_warehouse_id);
    if (Number(fromRow.quantity) < Number(quantity)) {
      return res.status(409).json({ error: 'Insufficient stock in source warehouse' });
    }
    const toRow = await getOrCreateStockRow(product_id, to_warehouse_id);

    await supabase.from('stock').update({ quantity: Number(fromRow.quantity) - Number(quantity) }).eq('id', fromRow.id);
    await supabase.from('stock').update({ quantity: Number(toRow.quantity) + Number(quantity) }).eq('id', toRow.id);

    const { data: movement, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        warehouse_id: from_warehouse_id,
        target_warehouse_id: to_warehouse_id,
        move_type: 'transfer',
        quantity,
        reason,
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ data: movement });
  })
);

export default router;
