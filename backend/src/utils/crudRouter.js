import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

/**
 * Builds a simple REST CRUD router (list/get/create/update/delete) backed by
 * a Supabase table, auto-scoped to the logged-in user's company_id.
 *
 * @param {string} table       Supabase table name
 * @param {string} module      Permission-module key (see `permissions` table)
 * @param {object} [opts]
 * @param {boolean} [opts.companyScoped=true]  Filter rows by company_id
 * @param {string}  [opts.orderBy='created_at']
 */
export function crudRouter(table, module, opts = {}) {
  const { companyScoped = true, orderBy = 'created_at' } = opts;
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    requirePermission(module, 'view'),
    asyncHandler(async (req, res) => {
      let query = supabase.from(table).select('*');
      if (companyScoped) query = query.eq('company_id', req.user.company_id);
      const { search } = req.query;
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query.order(orderBy, { ascending: false });
      if (error) throw error;
      res.json({ data });
    })
  );

  router.get(
    '/:id',
    requirePermission(module, 'view'),
    asyncHandler(async (req, res) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', req.params.id).single();
      if (error) return res.status(404).json({ error: 'Not found' });
      res.json({ data });
    })
  );

  router.post(
    '/',
    requirePermission(module, 'create'),
    asyncHandler(async (req, res) => {
      const payload = companyScoped ? { ...req.body, company_id: req.user.company_id } : req.body;
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) return res.status(400).json({ error: error.message });
      res.status(201).json({ data });
    })
  );

  router.put(
    '/:id',
    requirePermission(module, 'edit'),
    asyncHandler(async (req, res) => {
      const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      res.json({ data });
    })
  );

  router.delete(
    '/:id',
    requirePermission(module, 'delete'),
    asyncHandler(async (req, res) => {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      res.status(204).send();
    })
  );

  return router;
}
