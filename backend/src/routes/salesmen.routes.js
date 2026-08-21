import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('salesmen', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, avatar_url, is_active')
      .eq('company_id', req.user.company_id)
      .eq('role', 'salesman');
    if (error) throw error;
    res.json({ data });
  })
);

router.get(
  '/:id/performance',
  requirePermission('salesmen', 'view'),
  asyncHandler(async (req, res) => {
    const [targets, sales] = await Promise.all([
      supabase.from('targets').select('*').eq('salesman_id', req.params.id).order('period_start', { ascending: false }),
      supabase.from('sales').select('total_minor, created_at').eq('salesman_id', req.params.id),
    ]);
    res.json({ targets: targets.data || [], sales: sales.data || [] });
  })
);

router.post(
  '/targets',
  requirePermission('salesmen', 'create'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('targets')
      .insert({ ...req.body, company_id: req.user.company_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

router.get(
  '/visits',
  requirePermission('salesmen', 'view'),
  asyncHandler(async (req, res) => {
    const { salesman_id } = req.query;
    let query = supabase.from('visit_logs').select('*, dealers(name, address), users:salesman_id(name)').order('checked_in_at', { ascending: false }).limit(100);
    if (salesman_id) query = query.eq('salesman_id', salesman_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/visits',
  requirePermission('salesmen', 'create'),
  asyncHandler(async (req, res) => {
    const { dealer_id, latitude, longitude, note } = req.body;
    const { data, error } = await supabase
      .from('visit_logs')
      .insert({ salesman_id: req.user.id, dealer_id, latitude, longitude, note })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

export default router;
