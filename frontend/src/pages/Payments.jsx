import { useEffect, useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { Field, Select, Input } from '../components/ui/Input';
import { money, formatDate } from '../lib/format';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [filterDirection, setFilterDirection] = useState('');
  const [dealers, setDealers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('in');
  const [form, setForm] = useState({ dealer_id: '', supplier_id: '', amount_minor: '', method: 'cash', note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/payments', { params: { page, page_size: pageSize, direction: filterDirection || undefined } }),
      api.get('/dealers'),
      api.get('/masters/suppliers'),
    ])
      .then(([p, d, s]) => {
        setPayments(p.data.data);
        setTotal(p.data.total ?? p.data.data.length);
        setDealers(d.data.data);
        setSuppliers(s.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [page, filterDirection]);
  useEffect(() => setPage(1), [filterDirection]);

  const openModal = (dir) => {
    setDirection(dir);
    setForm({ dealer_id: '', supplier_id: '', amount_minor: '', method: 'cash', note: '' });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments', {
        party_type: direction === 'in' ? 'dealer' : 'supplier',
        dealer_id: direction === 'in' ? form.dealer_id : null,
        supplier_id: direction === 'out' ? form.supplier_id : null,
        direction,
        amount_minor: Math.round(Number(form.amount_minor) * 100),
        method: form.method,
        note: form.note,
      });
      toast.success(direction === 'in' ? 'Payment received' : 'Payment made');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-navy-900">Payments</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="w-40">
            <option value="">All directions</option>
            <option value="in">Received</option>
            <option value="out">Paid out</option>
          </Select>
          <Button variant="outline" icon={ArrowUpCircle} onClick={() => openModal('out')}>
            Pay Supplier
          </Button>
          <Button icon={ArrowDownCircle} onClick={() => openModal('in')}>
            Receive Payment
          </Button>
        </div>
      </div>

      <Card className="p-2">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
        <DataTable
          rows={payments}
          emptyLabel="No payments recorded yet"
          columns={[
            { key: 'receipt_no', header: 'Receipt' },
            { key: 'party', header: 'Party', render: (r) => r.dealers?.name || r.suppliers?.name || '—' },
            { key: 'direction', header: 'Direction', render: (r) => <Badge tone={r.direction === 'in' ? 'success' : 'warning'}>{r.direction === 'in' ? 'Received' : 'Paid'}</Badge> },
            { key: 'amount_minor', header: 'Amount', render: (r) => money(r.amount_minor) },
            { key: 'method', header: 'Method', render: (r) => <Badge tone="info">{r.method}</Badge> },
            { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
          ]}
        />
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={direction === 'in' ? 'Receive Payment' : 'Pay Supplier'}>
        <form onSubmit={submit}>
          {direction === 'in' ? (
            <Field label="Dealer">
              <Select required value={form.dealer_id} onChange={(e) => setForm({ ...form, dealer_id: e.target.value })}>
                <option value="">Select dealer</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Supplier">
              <Select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (৳)">
              <Input type="number" min="1" required value={form.amount_minor} onChange={(e) => setForm({ ...form, amount_minor: e.target.value })} />
            </Field>
            <Field label="Method">
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="card">Card</option>
              </Select>
            </Field>
          </div>
          <Field label="Note">
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Confirm {direction === 'in' ? 'Receipt' : 'Payment'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
