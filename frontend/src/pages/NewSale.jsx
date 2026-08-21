import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShoppingCart, ScanBarcode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { money } from '../lib/format';

export default function NewSale() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dealerId, setDealerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/dealers'), api.get('/products'), api.get('/masters/warehouses')]).then(([d, p, w]) => {
      setDealers(d.data.data);
      setProducts(p.data.data);
      setWarehouses(w.data.data);
    });
  }, []);

  const addItem = () => setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price_minor: 0 }]);

  const updateItem = (i, patch) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      if (patch.product_id) {
        const p = products.find((p) => p.id === patch.product_id);
        if (p) next[i].unit_price_minor = p.selling_price_minor;
      }
      return next;
    });
  };

  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Handheld / USB barcode scanners act as a keyboard: they type the code then
  // send Enter. This scans the product by barcode or SKU and bumps quantity by
  // 1 if it's already on the invoice, otherwise adds a new line.
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    const product = products.find((p) => p.barcode === code || p.sku === code);
    if (!product) {
      toast.error(`No product found for code "${code}"`);
      setBarcode('');
      return;
    }
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Number(next[idx].quantity) + 1 };
        return next;
      }
      return [...prev, { product_id: product.id, quantity: 1, unit_price_minor: product.selling_price_minor }];
    });
    toast.success(`Added ${product.name}`);
    setBarcode('');
    barcodeRef.current?.focus();
  };

  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.unit_price_minor || 0) * (i.quantity || 0), 0), [items]);

  const submit = async () => {
    if (!warehouseId || !items.length) {
      toast.error('Select a warehouse and add at least one item');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/sales', {
        dealer_id: dealerId || null,
        warehouse_id: warehouseId,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      toast.success(`Invoice ${data.data.invoice_no} created`);
      navigate('/sales');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create sale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/sales')} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-teal-600">
        <ArrowLeft size={15} /> Back to Sales
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-navy-900">Invoice Items</h3>
            <Button size="sm" variant="outline" icon={Plus} onClick={addItem} type="button">
              Add Item
            </Button>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <div className="relative">
              <ScanBarcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500" />
              <Input
                ref={barcodeRef}
                autoFocus
                placeholder="Scan or type barcode / SKU, then press Enter…"
                className="border-teal-200 bg-teal-50/40 pl-10 focus:border-teal-400"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </form>

          {items.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-navy-100 py-12 text-navy-300">
              <ShoppingCart size={28} />
              <p className="text-sm">No items added yet</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl bg-navy-50/50 p-3">
                <div className="col-span-5">
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
                    placeholder="Unit price"
                    value={item.unit_price_minor / 100}
                    onChange={(e) => updateItem(i, { unit_price_minor: Math.round(Number(e.target.value) * 100) })}
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-semibold text-navy-700">
                  {money(item.unit_price_minor * item.quantity)}
                </div>
                <button type="button" onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-danger hover:opacity-70">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy-900">Invoice Details</h3>
          <Field label="Dealer (optional for walk-in)">
            <Select value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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

          <div className="mt-5 border-t border-navy-100 pt-4">
            <div className="flex items-center justify-between text-sm text-navy-500">
              <span>Subtotal</span>
              <span className="font-semibold text-navy-800">{money(subtotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-bold text-navy-900">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>
          </div>

          <Button loading={saving} onClick={submit} className="mt-5 w-full">
            Create Invoice
          </Button>
        </Card>
      </div>
    </div>
  );
}
