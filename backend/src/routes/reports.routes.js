import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/sales',
  requirePermission('reports', 'view'),
  asyncHandler(async (req, res) => {
    const { from, to, dealer_id } = req.query;
    let query = supabase.from('sales').select('*, dealers(name), warehouses(name)').eq('company_id', req.user.company_id);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (dealer_id) query = query.eq('dealer_id', dealer_id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  })
);

router.get(
  '/inventory',
  requirePermission('reports', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('stock').select('*, products(name, sku, purchase_price_minor), warehouses(name)');
    if (error) throw error;
    const withValue = (data || []).map((r) => ({ ...r, stock_value_minor: r.quantity * (r.products?.purchase_price_minor || 0) }));
    res.json({ data: withValue });
  })
);

router.get(
  '/financial',
  requirePermission('reports', 'view'),
  asyncHandler(async (req, res) => {
    const [sales, purchases, payments] = await Promise.all([
      supabase.from('sales').select('total_minor, paid_minor, created_at').eq('company_id', req.user.company_id),
      supabase.from('purchases').select('total_minor, paid_minor, created_at').eq('company_id', req.user.company_id),
      supabase.from('payments').select('amount_minor, direction, created_at').eq('company_id', req.user.company_id),
    ]);
    const totalSales = (sales.data || []).reduce((s, r) => s + r.total_minor, 0);
    const totalPurchases = (purchases.data || []).reduce((s, r) => s + r.total_minor, 0);
    const totalReceived = (payments.data || []).filter((p) => p.direction === 'in').reduce((s, r) => s + r.amount_minor, 0);
    const totalPaidOut = (payments.data || []).filter((p) => p.direction === 'out').reduce((s, r) => s + r.amount_minor, 0);
    res.json({
      totalSales: totalSales / 100,
      totalPurchases: totalPurchases / 100,
      totalReceived: totalReceived / 100,
      totalPaidOut: totalPaidOut / 100,
      grossProfitEstimate: (totalSales - totalPurchases) / 100,
    });
  })
);

export default router;
