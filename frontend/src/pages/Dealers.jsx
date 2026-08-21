import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Input';
import { money } from '../lib/format';

const emptyForm = { name: '', business_name: '', phone: '', email: '', address: '', dealer_type: 'retailer', credit_limit_minor: 0 };

export default function Dealers() {
  const [dealers, setDealers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api
      .get('/dealers', { params: { search, page, page_size: pageSize } })
      .then(({ data }) => {
        setDealers(data.data);
        setTotal(data.total ?? data.data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, page]);

  useEffect(() => setPage(1), [search]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/dealers', {
        ...form,
        credit_limit_minor: Math.round(Number(form.credit_limit_minor || 0) * 100),
      });
      toast.success('Dealer added');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add dealer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
          <Input placeholder="Search by name, phone, code…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={() => setOpen(true)}>
          Add Dealer
        </Button>
      </div>

      <Card className="p-2">
        <DataTable
          rows={dealers}
          onRowClick={(row) => navigate(`/dealers/${row.id}`)}
          emptyLabel={loading ? 'Loading dealers…' : 'No dealers yet — add your first one'}
          columns={[
            { key: 'dealer_code', header: 'Code' },
            { key: 'name', header: 'Name', render: (r) => <span className="font-semibold text-navy-800">{r.name}</span> },
            { key: 'phone', header: 'Phone' },
            { key: 'dealer_type', header: 'Type', render: (r) => <Badge tone="teal">{r.dealer_type}</Badge> },
            { key: 'current_balance_minor', header: 'Balance', render: (r) => money(r.current_balance_minor) },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge> },
          ]}
        />
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Dealer">
        <form onSubmit={submit}>
          <Field label="Dealer name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Business name">
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dealer type">
              <Select value={form.dealer_type} onChange={(e) => setForm({ ...form, dealer_type: e.target.value })}>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="sub_dealer">Sub Dealer</option>
                <option value="distributor">Distributor</option>
              </Select>
            </Field>
            <Field label="Credit limit (৳)">
              <Input type="number" min="0" value={form.credit_limit_minor} onChange={(e) => setForm({ ...form, credit_limit_minor: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Save Dealer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
