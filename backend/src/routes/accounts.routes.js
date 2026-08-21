import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('accounts', 'view'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('accounts').select('*').eq('company_id', req.user.company_id);
    if (error) throw error;
    res.json({ data });
  })
);

router.post(
  '/',
  requirePermission('accounts', 'create'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...req.body, company_id: req.user.company_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  })
);

// Manual income/expense entry, or inter-account transfer
router.post(
  '/entries',
  requirePermission('accounts', 'create'),
  asyncHandler(async (req, res) => {
    const { account_id, type, amount_minor, description, transfer_to_account_id } = req.body;
    if (!account_id || !amount_minor) return res.status(400).json({ error: 'account_id and amount_minor are required' });

    const { data: account } = await supabase.from('accounts').select('*').eq('id', account_id).single();
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const delta = type === 'expense' || type === 'transfer_out' ? -amount_minor : amount_minor;
    const balance_after = account.balance_minor + delta;
    await supabase.from('accounts').update({ balance_minor: balance_after }).eq('id', account_id);

    await supabase.from('ledger_entries').insert({
      company_id: req.user.company_id,
      party_type: 'account',
      party_id: account_id,
      entry_type: delta >= 0 ? 'credit' : 'debit',
      amount_minor: Math.abs(amount_minor),
      balance_after_minor: balance_after,
      reference_type: type,
      description,
    });

    if (type === 'transfer' && transfer_to_account_id) {
      const { data: destAcc } = await supabase.from('accounts').select('*').eq('id', transfer_to_account_id).single();
      const destBalanceAfter = (destAcc?.balance_minor || 0) + amount_minor;
      await supabase.from('accounts').update({ balance_minor: destBalanceAfter }).eq('id', transfer_to_account_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'account',
        party_id: transfer_to_account_id,
        entry_type: 'credit',
        amount_minor,
        balance_after_minor: destBalanceAfter,
        reference_type: 'transfer_in',
        description,
      });
    }

    res.status(201).json({ ok: true, balance_after });
  })
);

router.get(
  '/ledger',
  requirePermission('accounts', 'view'),
  asyncHandler(async (req, res) => {
    const { party_type, party_id } = req.query;
    if (!party_type || !party_id) return res.status(400).json({ error: 'party_type and party_id are required' });
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('party_type', party_type)
      .eq('party_id', party_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  })
);

export default router;
