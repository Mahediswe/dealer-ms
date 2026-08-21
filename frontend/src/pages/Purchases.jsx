import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, ClipboardList } from 'lucide-react';
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

export default function Purchases() {
  const [tab, setTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/purchases', {
        params: { page, page_size: pageSize, supplier_id: filterSupplier || undefined, status: filterStatus || undefined },
      }),
      api.get('/purchases/orders'),
      api.get('/masters/suppliers'),
      api.get('/masters/warehouses'),
      api.get('/products'),
    ])
      .then(([pur, po, sup, wh, prod]) => {
        setPurchases(pur.data.data);
        setTotal(pur.data.total ?? pur.data.data.length);
        setOrders(po.data.data);
        setSuppliers(sup.data.data);
        setWarehouses(wh.data.data);
        setProducts(prod.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, filterSupplier, filterStatus]);
  useEffect(() => setPage(1), [filterSupplier, filterStatus]);

  const addItem = () => setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_cost_minor: 0 }]);
  const updateItem = (i, patch) =>
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!warehouseId || !items.length) {
      toast.error('Select a warehouse and add at least one item');
      return;
    }
    setSaving(true);
    try {
      await api.post('/purchases/receive', {
        supplier_id: supplierId || null,
        warehouse_id: warehouseId,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      toast.success('Purchase received and stock updated');
      setOpen(false);
      setItems([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not receive purchase');
    } finally {
      setSaving(false);
    }
  };

  const submitPO = async (e) => {
    e.preventDefault();
    if (!warehouseId || !items.length) {
      toast.error('Select a warehouse and add at least one item');
      return;
    }
    setSaving(true);
    try {
      await api.post('/purchases/orders', {
        supplier_id: supplierId || null,
        warehouse_id: warehouseId,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      toast.success('Purchase order created — awaiting approval');
      setPoOpen(false);
      setItems([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const approvePO = async (id) => {
    try {
      await api.post(`/purchases/orders/${id}/approve`);
      toast.success('Purchase order approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not approve');
    }
  };

  const rejectPO = async (id) => {
    const reason = prompt('Reason for rejection (optional)');
    try {
      await api.post(`/purchases/orders/${id}/reject`, { reason });
      toast.success('Purchase order rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reject');
    }
  };

  const poStatusTone = (s) => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-navy-100">
        {['purchases', 'orders'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'border-b-2 border-teal-500 text-teal-700' : 'text-navy-400 hover:text-navy-600'
            }`}
          >
            {t === 'orders' ? 'Purchase Orders' : 'Received Purchases'}
          </button>
        ))}
      </div>

      {tab === 'purchases' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-40">
                <option value="">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36">
                <option value="">All statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <Button icon={Plus} onClick={() => setOpen(true)}>
              Receive Stock
            </Button>
          </div>

          <Card className="p-2">
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : (
              <DataTable
                rows={purchases}
                emptyLabel="No purchases recorded yet"
                columns={[
                  { key: 'purchase_no', header: 'Purchase No.' },
                  { key: 'supplier', header: 'Supplier', render: (r) => r.suppliers?.name || '—' },
                  { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouses?.name || '—' },
                  { key: 'total_minor', header: 'Total', render: (r) => money(r.total_minor) },
                  { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'paid' ? 'success' : 'warning'}>{r.status}</Badge> },
                  { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
                ]}
              />
            )}
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </Card>
        </>
      )}

      {tab === 'orders' && (
        <>
          <div className="flex justify-end">
            <Button icon={ClipboardList} onClick={() => setPoOpen(true)}>
              New Purchase Order
            </Button>
          </div>
          <Card className="p-2">
            <DataTable
              rows={orders}
              emptyLabel={loading ? 'Loading…' : 'No purchase orders yet'}
              columns={[
                { key: 'po_number', header: 'PO Number' },
                { key: 'supplier', header: 'Supplier', render: (r) => r.suppliers?.name || '—' },
                { key: 'total_amount_minor', header: 'Total', render: (r) => money(r.total_amount_minor) },
                { key: 'status', header: 'Status', render: (r) => <Badge tone={poStatusTone(r.status)}>{r.status}</Badge> },
                { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
                {
                  key: 'actions',
                  header: '',
                  render: (r) =>
                    r.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" icon={Check} onClick={() => approvePO(r.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" icon={X} onClick={() => rejectPO(r.id)}>
                          Reject
                        </Button>
                      </div>
                    ) : null,
                },
              ]}
            />
          </Card>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Receive Stock (New Purchase)" width="max-w-2xl">
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier">
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Warehouse">
              <Select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-navy-500">Items</p>
            <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="mt-2 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-xl bg-navy-50/50 p-2.5">
                <div className="col-span-6">
                  <Select value={item.product_id} onChange={(e) => updateItem(i, { product_id: e.target.value })}>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Unit cost"
                    value={item.unit_cost_minor / 100}
                    onChange={(e) => updateItem(i, { unit_cost_minor: Math.round(Number(e.target.value) * 100) })}
                  />
                </div>
                <button type="button" onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button type="submit" loading={saving} className="mt-4 w-full">
            Confirm Receipt
          </Button>
        </form>
      </Modal>

      <Modal open={poOpen} onClose={() => setPoOpen(false)} title="New Purchase Order" width="max-w-2xl">
        <form onSubmit={submitPO}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier">
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Warehouse">
              <Select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-navy-500">Items</p>
            <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="mt-2 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-xl bg-navy-50/50 p-2.5">
                <div className="col-span-6">
                  <Select value={item.product_id} onChange={(e) => updateItem(i, { product_id: e.target.value })}>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Unit cost"
                    value={item.unit_cost_minor / 100}
                    onChange={(e) => updateItem(i, { unit_cost_minor: Math.round(Number(e.target.value) * 100) })}
                  />
                </div>
                <button type="button" onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button type="submit" loading={saving} className="mt-4 w-full">
            Submit for Approval
          </Button>
        </form>
      </Modal>
    </div>
  );
}

