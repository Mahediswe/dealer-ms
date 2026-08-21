import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler, generateCode } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('products', 'view'),
  asyncHandler(async (req, res) => {
    let query = supabase
      .from('products')
      .select('*, categories(name), brands(name), units(name)', { count: 'exact' })
      .eq('company_id', req.user.company_id);
    const { search, category_id, page, page_size = 25 } = req.query;
    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    if (category_id) query = query.eq('category_id', category_id);
    query = query.order('created_at', { ascending: false });
    // Only paginate when the caller explicitly asks for a page — dropdown/select
    // callers that just do GET /products without ?page still get the full list.
    if (page) {
      const from = (Number(page) - 1) * Number(page_size);
      const to = from + Number(page_size) - 1;
      query = query.range(from, to);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: page ? Number(page) : undefined, page_size: Number(page_size) });
  })
);

router.get(
  '/:id',
  requirePermission('products', 'view'),
  asyncHandler(async (req, res) => {
    const [product, stockRows, batches, variants] = await Promise.all([
      supabase.from('products').select('*').eq('id', req.params.id).single(),
      supabase.from('stock').select('*, warehouses(name)').eq('product_id', req.params.id),
      supabase.from('product_batches').select('*').eq('product_id', req.params.id),
      supabase.from('product_variants').select('*').eq('product_id', req.params.id),
    ]);
    if (product.error) return res.status(404).json({ error: 'Product not found' });
    res.json({
      product: product.data,
      stock: stockRows.data || [],
      batches: batches.data || [],
      variants: variants.data || [],
    });
  })
);

router.post(
  '/',
  requirePermission('products', 'create'),
  asyncHandler(async (req, res) => {
    const sku = req.body.sku || generateCode('SKU');
    const { data, error } = await supabase
      .from('products')
      .insert({ ...req.body, sku, company_id: req.user.company_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

router.put(
  '/:id',
  requirePermission('products', 'edit'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('products').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

router.delete(
  '/:id',
  requirePermission('products', 'delete'),
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
  })
);

export default router;
