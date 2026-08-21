import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('branches').select('*').eq('company_id', req.user.company_id).order('is_head_office', { ascending: false });
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { data, error } = await supabase
      .from('branches')
      .insert({ company_id: req.user.company_id, name, address })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

router.put(
  '/:id',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('branches').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

export default router;
