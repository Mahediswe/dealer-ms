import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/company',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('companies').select('*').eq('id', req.user.company_id).single();
    if (error) throw error;
    res.json({ data });
  })
);

router.put(
  '/company',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('companies').update(req.body).eq('id', req.user.company_id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

router.get(
  '/users',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, is_active, branch_id, created_at')
      .eq('company_id', req.user.company_id);
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/users',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, branch_id, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password and role are required' });
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ company_id: req.user.company_id, branch_id, name, email, phone, role, password_hash })
      .select('id, name, email, phone, role, is_active')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

router.put(
  '/users/:id',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    delete body.password_hash;
    if (body.password) {
      body.password_hash = await bcrypt.hash(body.password, 10);
      delete body.password;
    }
    const { data, error } = await supabase.from('users').update(body).eq('id', req.params.id).select('id, name, email, role, is_active').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

router.get(
  '/permissions',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('permissions').select('*').order('module');
    if (error) throw error;
    res.json({ data });
  })
);

router.put(
  '/permissions/:id',
  requireRole('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('permissions').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  })
);

export default router;
