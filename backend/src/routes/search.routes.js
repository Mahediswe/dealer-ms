import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ dealers: [], products: [], sales: [] });

    const companyId = req.user.company_id;
    const [dealers, products, sales] = await Promise.all([
      supabase
        .from('dealers')
        .select('id, name, phone, dealer_code')
        .eq('company_id', companyId)
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%,dealer_code.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('products')
        .select('id, name, sku')
        .eq('company_id', companyId)
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(5),
      supabase.from('sales').select('id, invoice_no, total_minor').eq('company_id', companyId).ilike('invoice_no', `%${q}%`).limit(5),
    ]);

    res.json({
      dealers: dealers.data || [],
      products: products.data || [],
      sales: sales.data || [],
    });
  })
);

export default router;
