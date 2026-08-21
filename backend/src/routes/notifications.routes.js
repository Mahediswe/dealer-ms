import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

export default router;
