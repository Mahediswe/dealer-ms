import { useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Field, Select, Textarea } from '../components/ui/Input';
import { initials, formatDateTime } from '../lib/format';

export default function Salesmen() {
  const [tab, setTab] = useState('team');
  const [team, setTeam] = useState([]);
  const [visits, setVisits] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ dealer_id: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/salesmen'), api.get('/salesmen/visits'), api.get('/dealers')])
      .then(([t, v, d]) => {
        setTeam(t.data.data);
        setVisits(v.data.data);
        setDealers(d.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const logVisit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => resolve(null),
          { timeout: 4000 }
        );
      });
      await api.post('/salesmen/visits', { ...form, ...(pos || {}) });
      toast.success('Visit logged');
      setOpen(false);
      setForm({ dealer_id: '', note: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not log visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 border-b border-navy-100">
          {['team', 'visits'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'border-b-2 border-teal-500 text-teal-700' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              {t === 'visits' ? 'Visit Log' : 'Team'}
            </button>
          ))}
        </div>
        {tab === 'visits' && (
          <Button icon={Plus} onClick={() => setOpen(true)}>
            Log Visit
          </Button>
        )}
      </div>

      {tab === 'team' && (
        <Card className="p-2">
          <DataTable
            rows={team}
            emptyLabel={loading ? 'Loading team…' : 'No salesmen added yet — create users with the "salesman" role in Settings'}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
                      {initials(r.name)}
                    </div>
                    <span className="font-semibold text-navy-800">{r.name}</span>
                  </div>
                ),
              },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Phone' },
              { key: 'is_active', header: 'Status', render: (r) => <Badge tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === 'visits' && (
        <Card className="p-2">
          <DataTable
            rows={visits}
            emptyLabel={loading ? 'Loading visits…' : 'No dealer visits logged yet'}
            columns={[
              { key: 'salesman', header: 'Salesman', render: (r) => r.users?.name || '—' },
              { key: 'dealer', header: 'Dealer', render: (r) => r.dealers?.name || '—' },
              {
                key: 'location',
                header: 'Location',
                render: (r) =>
                  r.latitude ? (
                    <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                      <MapPin size={12} /> {Number(r.latitude).toFixed(3)}, {Number(r.longitude).toFixed(3)}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              { key: 'note', header: 'Note', render: (r) => r.note || '—' },
              { key: 'checked_in_at', header: 'Time', render: (r) => formatDateTime(r.checked_in_at) },
            ]}
          />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Dealer Visit">
        <form onSubmit={logVisit}>
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
          <Field label="Note">
            <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="What was discussed, orders taken, etc." />
          </Field>
          <p className="mb-3 text-xs text-navy-400">Your device location will be attached if permission is granted.</p>
          <Button type="submit" loading={saving} className="w-full">
            Save Visit
          </Button>
        </form>
      </Modal>
    </div>
  );
}
