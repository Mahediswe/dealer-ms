import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler, generateCode } from '../utils/helpers.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('payments', 'view'),
  asyncHandler(async (req, res) => {
    const { dealer_id, supplier_id, direction, from, to, page, page_size = 25 } = req.query;
    let query = supabase.from('payments').select('*, dealers(name), suppliers(name)', { count: 'exact' }).eq('company_id', req.user.company_id);
    if (dealer_id) query = query.eq('dealer_id', dealer_id);
    if (supplier_id) query = query.eq('supplier_id', supplier_id);
    if (direction) query = query.eq('direction', direction);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    query = query.order('created_at', { ascending: false });
    if (page) {
      const start = (Number(page) - 1) * Number(page_size);
      query = query.range(start, start + Number(page_size) - 1);
    } else {
      query = query.limit(500);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: page ? Number(page) : undefined, page_size: Number(page_size) });
  })
);

// Receive payment from a dealer (direction=in) or pay a supplier (direction=out)
router.post(
  '/',
  requirePermission('payments', 'create'),
  asyncHandler(async (req, res) => {
    const { party_type, dealer_id, supplier_id, direction, amount_minor, method = 'cash', reference, note, allocations = [] } = req.body;
    if (!party_type || !direction || !amount_minor) {
      return res.status(400).json({ error: 'party_type, direction and amount_minor are required' });
    }

    const receipt_no = generateCode(direction === 'in' ? 'RCV' : 'PAY');
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        company_id: req.user.company_id,
        receipt_no,
        party_type,
        dealer_id,
        supplier_id,
        direction,
        amount_minor,
        method,
        reference,
        note,
        created_by: req.user.id,
      })
      .select()
      .single();
    if (error) throw error;

    if (allocations.length) {
      await supabase.from('payment_allocations').insert(
        allocations.map((a) => ({ payment_id: payment.id, sale_id: a.sale_id, purchase_id: a.purchase_id, amount_minor: a.amount_minor }))
      );
      for (const a of allocations) {
        if (a.sale_id) {
          const { data: sale } = await supabase.from('sales').select('paid_minor,total_minor').eq('id', a.sale_id).single();
          const paid_minor = (sale?.paid_minor || 0) + a.amount_minor;
          const status = paid_minor >= sale.total_minor ? 'paid' : 'partial';
          await supabase.from('sales').update({ paid_minor, status }).eq('id', a.sale_id);
        }
        if (a.purchase_id) {
          const { data: purchase } = await supabase.from('purchases').select('paid_minor,total_minor').eq('id', a.purchase_id).single();
          const paid_minor = (purchase?.paid_minor || 0) + a.amount_minor;
          const status = paid_minor >= purchase.total_minor ? 'paid' : 'partial';
          await supabase.from('purchases').update({ paid_minor, status }).eq('id', a.purchase_id);
        }
      }
    }

    // Update party balance + ledger
    if (party_type === 'dealer' && dealer_id) {
      const { data: dealer } = await supabase.from('dealers').select('current_balance_minor').eq('id', dealer_id).single();
      const balance_after = (dealer?.current_balance_minor || 0) - amount_minor; // payment received reduces receivable
      await supabase.from('dealers').update({ current_balance_minor: balance_after }).eq('id', dealer_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'dealer',
        party_id: dealer_id,
        entry_type: 'credit',
        amount_minor,
        balance_after_minor: balance_after,
        reference_type: 'payment',
        reference_id: payment.id,
        description: `Payment received (${receipt_no})`,
      });
    }
    if (party_type === 'supplier' && supplier_id) {
      const { data: supplier } = await supabase.from('suppliers').select('current_balance_minor').eq('id', supplier_id).single();
      const balance_after = (supplier?.current_balance_minor || 0) - amount_minor; // payment made reduces payable
      await supabase.from('suppliers').update({ current_balance_minor: balance_after }).eq('id', supplier_id);
      await supabase.from('ledger_entries').insert({
        company_id: req.user.company_id,
        party_type: 'supplier',
        party_id: supplier_id,
        entry_type: 'debit',
        amount_minor,
        balance_after_minor: balance_after,
        reference_type: 'payment',
        reference_id: payment.id,
        description: `Payment made (${receipt_no})`,
      });
    }

    if (party_type === 'dealer' && dealer_id) {
      const { data: dealer } = await supabase.from('dealers').select('name').eq('id', dealer_id).single();
      notify(req.app.get('io'), {
        companyId: req.user.company_id,
        type: 'payment_received',
        title: `Payment received from ${dealer?.name || 'dealer'}`,
        message: `${receipt_no} · ${(amount_minor / 100).toLocaleString()} BDT`,
      });
    }

    res.status(201).json({ data: payment });
  })
);

export default router;
