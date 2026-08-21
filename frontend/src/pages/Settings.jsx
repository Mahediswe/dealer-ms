import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'manager', 'accountant', 'salesman', 'warehouse_staff', 'cashier'];

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('company');
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'salesman', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/settings/company').then(({ data }) => setCompany(data.data));
    api.get('/settings/users').then(({ data }) => setUsers(data.data)).catch(() => {});
    api.get('/masters/warehouses').then(({ data }) => setWarehouses(data.data)).catch(() => {});
    api.get('/branches').then(({ data }) => setBranches(data.data)).catch(() => {});
  };
  useEffect(load, []);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/company', { name: company.name, currency: company.currency, tax_percent: company.tax_percent });
      toast.success('Company profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/users', form);
      toast.success('Team member added');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'salesman', phone: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add user');
    } finally {
      setSaving(false);
    }
  };

  const addWarehouse = async (name) => {
    try {
      await api.post('/masters/warehouses', { name });
      toast.success('Warehouse added');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add warehouse');
    }
  };

  const addBranch = async (name) => {
    try {
      await api.post('/branches', { name });
      toast.success('Branch added');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add branch');
    }
  };

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-navy-100">
        {['company', 'team', 'warehouses', 'branches'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'border-b-2 border-teal-500 text-teal-700' : 'text-navy-400 hover:text-navy-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'company' && company && (
        <Card className="max-w-lg p-6">
          <form onSubmit={saveCompany}>
            <Field label="Company name">
              <Input value={company.name || ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} disabled={!isAdmin} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <Input value={company.currency || 'BDT'} onChange={(e) => setCompany({ ...company, currency: e.target.value })} disabled={!isAdmin} />
              </Field>
              <Field label="Tax %">
                <Input type="number" value={company.tax_percent || 0} onChange={(e) => setCompany({ ...company, tax_percent: e.target.value })} disabled={!isAdmin} />
              </Field>
            </div>
            {isAdmin && (
              <Button type="submit" className="mt-2">
                Save Changes
              </Button>
            )}
          </form>
        </Card>
      )}

      {tab === 'team' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button icon={Plus} onClick={() => setOpen(true)}>
                Add Team Member
              </Button>
            </div>
          )}
          <Card className="p-2">
            <DataTable
              rows={users}
              emptyLabel="No team members yet"
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'email', header: 'Email' },
                { key: 'role', header: 'Role', render: (r) => <Badge tone="teal">{r.role.replace('_', ' ')}</Badge> },
                { key: 'is_active', header: 'Status', render: (r) => <Badge tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
              ]}
            />
          </Card>
        </div>
      )}

      {tab === 'warehouses' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button icon={Plus} onClick={() => { const n = prompt('Warehouse name'); if (n) addWarehouse(n); }}>
                Add Warehouse
              </Button>
            </div>
          )}
          <Card className="p-2">
            <DataTable rows={warehouses} emptyLabel="No warehouses yet" columns={[{ key: 'name', header: 'Name' }, { key: 'address', header: 'Address' }]} />
          </Card>
        </div>
      )}

      {tab === 'branches' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button icon={Plus} onClick={() => { const n = prompt('Branch name'); if (n) addBranch(n); }}>
                Add Branch
              </Button>
            </div>
          )}
          <Card className="p-2">
            <DataTable
              rows={branches}
              emptyLabel="No branches yet"
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'address', header: 'Address' },
                { key: 'is_head_office', header: 'Type', render: (r) => <Badge tone={r.is_head_office ? 'teal' : 'neutral'}>{r.is_head_office ? 'Head Office' : 'Branch'}</Badge> },
              ]}
            />
          </Card>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <form onSubmit={addUser}>
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Add Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}
