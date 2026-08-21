import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusTone } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Field, Select, Input } from '../components/ui/Input';
import { money, formatDateTime } from '../lib/format';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({ product_id: '', quantity: 1, reason: 'customer_return' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get(`/sales/${id}`)
      .then(({ data }) => {
        setSale(data.sale);
        setItems(data.items);
      })
      .catch(() => toast.error('Could not load invoice'));
  };
  useEffect(load, [id]);

  const submitReturn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/returns/sales', { sale_id: id, ...returnForm, quantity: Number(returnForm.quantity) });
      toast.success('Return processed and stock updated');
      setReturnOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
    } finally {
      setSaving(false);
    }
  };

  if (!sale) return <p className="text-navy-400">Loading invoice…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/sales')} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-teal-600">
          <ArrowLeft size={15} /> Back to Sales
        </button>
        <div className="flex gap-2">
          <Button variant="outline" icon={Undo2} onClick={() => setReturnOpen(true)}>
            Process Return
          </Button>
          <Button icon={Printer} onClick={() => window.print()}>
            Print Invoice
          </Button>
        </div>
      </div>

      <Card className="p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-navy-100 pb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">Invoice {sale.invoice_no}</h2>
            <p className="mt-1 text-sm text-navy-400">{formatDateTime(sale.created_at)}</p>
          </div>
          <Badge tone={statusTone(sale.status)} className="text-sm">
            {sale.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase text-navy-400">Billed To</p>
            <p className="mt-1 font-semibold text-navy-800">{sale.dealers?.name || 'Walk-in Customer'}</p>
            {sale.dealers?.phone && <p className="text-sm text-navy-400">{sale.dealers.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-navy-400">Warehouse</p>
            <p className="mt-1 font-semibold text-navy-800">{sale.warehouses?.name}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase text-navy-400">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-navy-50">
                <td className="py-3 text-navy-700">{item.products?.name}</td>
                <td className="py-3 text-right text-navy-500">{item.quantity}</td>
                <td className="py-3 text-right text-navy-500">{money(item.unit_price_minor)}</td>
                <td className="py-3 text-right font-semibold text-navy-800">{money(item.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-navy-500">
            <span>Subtotal</span>
            <span>{money(sale.subtotal_minor)}</span>
          </div>
          <div className="flex justify-between text-navy-500">
            <span>Discount</span>
            <span>-{money(sale.discount_minor)}</span>
          </div>
          <div className="flex justify-between text-navy-500">
            <span>Tax</span>
            <span>{money(sale.tax_minor)}</span>
          </div>
          <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-bold text-navy-900">
            <span>Total</span>
            <span>{money(sale.total_minor)}</span>
          </div>
          <div className="flex justify-between text-success">
            <span>Paid</span>
            <span>{money(sale.paid_minor)}</span>
          </div>
          <div className="flex justify-between font-semibold text-danger">
            <span>Balance Due</span>
            <span>{money(sale.total_minor - sale.paid_minor)}</span>
          </div>
        </div>
      </Card>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Process Return">
        <form onSubmit={submitReturn}>
          <Field label="Product">
            <Select required value={returnForm.product_id} onChange={(e) => setReturnForm({ ...returnForm, product_id: e.target.value })}>
              <option value="">Select product</option>
              {items.map((i) => (
                <option key={i.product_id} value={i.product_id}>
                  {i.products?.name} (sold {i.quantity})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Return quantity">
            <Input type="number" min="1" required value={returnForm.quantity} onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })} />
          </Field>
          <Field label="Reason">
            <Select value={returnForm.reason} onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}>
              <option value="customer_return">Customer return</option>
              <option value="damaged">Damaged</option>
              <option value="wrong_product">Wrong product</option>
              <option value="excess_quantity">Excess quantity</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Button type="submit" loading={saving} className="mt-2 w-full">
            Confirm Return
          </Button>
        </form>
      </Modal>
    </div>
  );
}
