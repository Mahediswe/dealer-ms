import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const companyId = req.user.company_id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [todaySales, yesterdaySales, todayPurchases, dealers, products, stockRows, recentSales] = await Promise.all([
      supabase.from('sales').select('total_minor').eq('company_id', companyId).gte('created_at', startOfToday.toISOString()),
      supabase
        .from('sales')
        .select('total_minor')
        .eq('company_id', companyId)
        .gte('created_at', startOfYesterday.toISOString())
        .lt('created_at', startOfToday.toISOString()),
      supabase.from('purchases').select('total_minor').eq('company_id', companyId).gte('created_at', startOfToday.toISOString()),
      supabase.from('dealers').select('current_balance_minor').eq('company_id', companyId),
      supabase.from('products').select('id, name, min_stock').eq('company_id', companyId),
      supabase.from('stock').select('product_id, quantity'),
      supabase
        .from('sales')
        .select('id, invoice_no, total_minor, status, created_at, dealers(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const todaysSalesTotal = (todaySales.data || []).reduce((s, r) => s + r.total_minor, 0);
    const yesterdaysSalesTotal = (yesterdaySales.data || []).reduce((s, r) => s + r.total_minor, 0);
    const salesGrowthPercent = yesterdaysSalesTotal > 0 ? ((todaysSalesTotal - yesterdaysSalesTotal) / yesterdaysSalesTotal) * 100 : null;
    const todaysPurchaseTotal = (todayPurchases.data || []).reduce((s, r) => s + r.total_minor, 0);
    const totalReceivable = (dealers.data || []).reduce((s, d) => s + Math.max(d.current_balance_minor, 0), 0);

    const stockByProduct = {};
    (stockRows.data || []).forEach((r) => {
      stockByProduct[r.product_id] = (stockByProduct[r.product_id] || 0) + Number(r.quantity);
    });
    const lowStockCount = (products.data || []).filter((p) => (stockByProduct[p.id] || 0) <= (p.min_stock || 0)).length;

    res.json({
      todaysSalesTotal,
      salesGrowthPercent,
      todaysPurchaseTotal,
      totalReceivable,
      lowStockCount,
      totalProducts: (products.data || []).length,
      totalDealers: (dealers.data || []).length,
      recentSales: recentSales.data || [],
    });
  })
);

router.get(
  '/sales-trend',
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days || 14);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase
      .from('sales')
      .select('total_minor, created_at')
      .eq('company_id', req.user.company_id)
      .gte('created_at', since.toISOString());
    if (error) throw error;

    const byDay = {};
    (data || []).forEach((r) => {
      const day = r.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + r.total_minor;
    });
    const series = Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, total_minor]) => ({ date, total: total_minor / 100 }));

    res.json({ data: series });
  })
);

router.get(
  '/top-products',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('sale_items').select('product_id, quantity, line_total_minor, products(name)');
    if (error) throw error;
    const grouped = {};
    (data || []).forEach((r) => {
      const key = r.product_id;
      if (!grouped[key]) grouped[key] = { name: r.products?.name || 'Unknown', quantity: 0, revenue: 0 };
      grouped[key].quantity += Number(r.quantity);
      grouped[key].revenue += r.line_total_minor / 100;
    });
    const top = Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
    res.json({ data: top });
  })
);

export default router;
