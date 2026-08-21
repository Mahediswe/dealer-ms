import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler, generateCode } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('dealers', 'view'),
  asyncHandler(async (req, res) => {
    let query = supabase.from('dealers').select('*', { count: 'exact' }).eq('company_id', req.user.company_id);
    const { search, status, territory_id, page, page_size = 25 } = req.query;
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,dealer_code.ilike.%${search}%`);
    if (status) query = query.eq('status', status);
    if (territory_id) query = query.eq('territory_id', territory_id);
    query = query.order('created_at', { ascending: false });
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

router.post(
  '/',
  requirePermission('dealers', 'create'),
  asyncHandler(async (req, res) => {
    const dealer_code = req.body.dealer_code || generateCode('DLR');
    const { data: dupe } = await supabase
      .from('dealers')
      .select('id')
      .eq('company_id', req.user.company_id)
      .eq('phone', req.body.phone)
      .eq('name', req.body.name)
      .maybeSingle();
    if (dupe) return res.status(409).json({ error: 'A dealer with this name and phone already exists' });

    const { data, error } = await supabase
      .from('dealers')
      .insert({
        ...req.body,
        dealer_code,
        current_balance_minor: req.body.opening_balance_minor || 0,
        company_id: req.user.company_id,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

// Dealer 360° view — profile + sales + payments + returns + ledger in one call
router.get(
  '/:id/360',
  requirePermission('dealers', 'view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [profile, sales, payments, ledger] = await Promise.all([
      supabase.from('dealers').select('*').eq('id', id).single(),
      supabase.from('sales').select('*').eq('dealer_id', id).order('created_at', { ascending: false }).limit(50),
      supabase
        .from('payments')
        .select('*')
        .eq('dealer_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ledger_entries')
        .select('*')
        .eq('party_type', 'dealer')
        .eq('party_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (profile.error) return res.status(404).json({ error: 'Dealer not found' });
    res.json({
      profile: profile.data,
      sales: sales.data || [],
      payments: payments.data || [],
      ledger: ledger.data || [],
    });
  })
);

router.put(
  '/:id',
  requirePermission('dealers', 'edit'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('dealers')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

router.delete(
  '/:id',
  requirePermission('dealers', 'delete'),
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from('dealers').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
  })
);

export default router;
