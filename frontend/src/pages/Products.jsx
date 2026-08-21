import { useEffect, useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Input';
import ImageUpload from '../components/ui/ImageUpload';
import { money } from '../lib/format';

const emptyForm = { name: '', purchase_price_minor: 0, selling_price_minor: 0, min_stock: 0, image_url: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/products', { params: { search, page, page_size: pageSize } })
      .then(({ data }) => {
        setProducts(data.data);
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
      await api.post('/products', {
        ...form,
        purchase_price_minor: Math.round(Number(form.purchase_price_minor || 0) * 100),
        selling_price_minor: Math.round(Number(form.selling_price_minor || 0) * 100),
      });
      toast.success('Product added');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
          <Input placeholder="Search by name, SKU, barcode…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={() => setOpen(true)}>
          Add Product
        </Button>
      </div>

      <Card className="p-2">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
        <DataTable
          rows={products}
          emptyLabel="No products yet — add your first one"
          columns={[
            {
              key: 'name',
              header: 'Product',
              render: (r) => (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-navy-50 text-navy-400">
                    {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : <Package size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-800">{r.name}</p>
                    <p className="text-xs text-navy-400">{r.sku}</p>
                  </div>
                </div>
              ),
            },
            { key: 'categories', header: 'Category', render: (r) => r.categories?.name || '—' },
            { key: 'purchase_price_minor', header: 'Cost', render: (r) => money(r.purchase_price_minor) },
            { key: 'selling_price_minor', header: 'Price', render: (r) => money(r.selling_price_minor) },
            { key: 'is_active', header: 'Status', render: (r) => <Badge tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Product">
        <form onSubmit={submit}>
          <Field label="Product photo">
            <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" />
          </Field>
          <Field label="Product name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase price (৳)">
              <Input type="number" min="0" step="0.01" value={form.purchase_price_minor} onChange={(e) => setForm({ ...form, purchase_price_minor: e.target.value })} />
            </Field>
            <Field label="Selling price (৳)">
              <Input type="number" min="0" step="0.01" value={form.selling_price_minor} onChange={(e) => setForm({ ...form, selling_price_minor: e.target.value })} />
            </Field>
          </div>
          <Field label="Minimum stock alert level">
            <Input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Save Product
          </Button>
        </form>
      </Modal>
    </div>
  );
}
