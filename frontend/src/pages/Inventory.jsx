import { useEffect, useState } from 'react';
import { PackagePlus, PackageMinus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Input';

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [moveType, setMoveType] = useState('in');
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/inventory/stock'), api.get('/products'), api.get('/masters/warehouses')])
      .then(([s, p, w]) => {
        setStock(s.data.data);
        setProducts(p.data.data);
        setWarehouses(w.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openModal = (type) => {
    setMoveType(type);
    setForm({ product_id: '', warehouse_id: '', quantity: '', reason: '' });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/movements', { ...form, move_type: moveType });
      toast.success(moveType === 'in' ? 'Stock added' : 'Stock removed');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Movement failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-navy-900">Stock Levels</h2>
        <div className="flex gap-2">
          <Button variant="outline" icon={PackageMinus} onClick={() => openModal('out')}>
            Stock Out
          </Button>
          <Button icon={PackagePlus} onClick={() => openModal('in')}>
            Stock In
          </Button>
        </div>
      </div>

      <Card className="p-2">
        <DataTable
          rows={stock}
          emptyLabel={loading ? 'Loading stock…' : 'No stock records yet'}
          columns={[
            { key: 'product', header: 'Product', render: (r) => r.products?.name || '—' },
            { key: 'sku', header: 'SKU', render: (r) => r.products?.sku || '—' },
            { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouses?.name || '—' },
            { key: 'quantity', header: 'Quantity', render: (r) => <span className="font-semibold">{r.quantity}</span> },
            {
              key: 'status',
              header: 'Status',
              render: (r) =>
                r.quantity <= (r.products?.min_stock ?? 0) ? (
                  <Badge tone="danger" pulse>
                    <AlertTriangle size={11} /> Low stock
                  </Badge>
                ) : (
                  <Badge tone="success">In stock</Badge>
                ),
            },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={moveType === 'in' ? 'Stock In' : 'Stock Out'}>
        <form onSubmit={submit}>
          <Field label="Product">
            <Select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Warehouse">
            <Select required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity">
            <Input type="number" min="0.01" step="0.01" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Reason / note">
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. New shipment, damaged goods…" />
          </Field>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Confirm {moveType === 'in' ? 'Stock In' : 'Stock Out'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
