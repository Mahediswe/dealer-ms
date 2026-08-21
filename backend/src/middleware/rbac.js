import { supabase } from '../config/supabase.js';

// Roles that always pass — owners of the system/company account.
const SUPER_ROLES = new Set(['super_admin', 'admin']);

/**
 * requirePermission('dealers', 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export')
 * Checks the `permissions` table for the logged-in user's role + module.
 * Falls back to allow if no permission row exists yet (first-run friendliness) —
 * tighten this in production by seeding the permissions table (see supabase/schema.sql).
 */
export function requirePermission(module, action = 'view') {
  return async (req, res, next) => {
    try {
      const { role } = req.user || {};
      if (!role) return res.status(401).json({ error: 'Not authenticated' });
      if (SUPER_ROLES.has(role)) return next();

      const column = `can_${action}`;
      const { data, error } = await supabase
        .from('permissions')
        .select(column)
        .eq('role', role)
        .eq('module', module)
        .maybeSingle();

      if (error) return res.status(500).json({ error: 'Permission check failed' });
      if (!data) return next(); // no explicit rule configured yet — permissive default
      if (!data[column]) return res.status(403).json({ error: `Not permitted to ${action} ${module}` });

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role for this action' });
    }
    next();
  };
}
