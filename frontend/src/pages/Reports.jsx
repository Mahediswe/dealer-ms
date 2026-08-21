import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, Download } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import { money, formatDate } from '../lib/format';
import { exportToCsv } from '../lib/csv';

export default function Reports() {
  const [financial, setFinancial] = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [inventoryReport, setInventoryReport] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/reports/financial'), api.get('/reports/sales'), api.get('/reports/inventory')]).then(([f, s, i]) => {
      setFinancial(f.data);
      setSalesReport(s.data.data);
      setInventoryReport(i.data.data);
    });
  }, []);

  const exportSales = () =>
    exportToCsv('sales-report.csv', salesReport, [
      { label: 'Invoice', value: (r) => r.invoice_no },
      { label: 'Dealer', value: (r) => r.dealers?.name || 'Walk-in' },
      { label: 'Total (BDT)', value: (r) => (r.total_minor / 100).toFixed(2) },
      { label: 'Status', value: (r) => r.status },
      { label: 'Date', value: (r) => r.created_at },
    ]);

  const exportInventory = () =>
    exportToCsv('inventory-valuation.csv', inventoryReport, [
      { label: 'Product', value: (r) => r.products?.name || '—' },
      { label: 'Warehouse', value: (r) => r.warehouses?.name || '—' },
      { label: 'Quantity', value: (r) => r.quantity },
      { label: 'Stock Value (BDT)', value: (r) => (r.stock_value_minor / 100).toFixed(2) },
    ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sales" value={`৳ ${(financial?.totalSales ?? 0).toLocaleString()}`} icon={TrendingUp} tone="teal" />
        <StatCard label="Total Purchases" value={`৳ ${(financial?.totalPurchases ?? 0).toLocaleString()}`} icon={TrendingDown} tone="navy" />
        <StatCard label="Cash Received" value={`৳ ${(financial?.totalReceived ?? 0).toLocaleString()}`} icon={DollarSign} tone="gold" />
        <StatCard label="Est. Gross Profit" value={`৳ ${(financial?.grossProfitEstimate ?? 0).toLocaleString()}`} icon={Percent} tone="teal" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">Sales Report</h3>
          <Button size="sm" variant="outline" icon={Download} onClick={exportSales}>
            Export CSV
          </Button>
        </div>
        <DataTable
          rows={salesReport.slice(0, 20)}
          emptyLabel="No sales data yet"
          columns={[
            { key: 'invoice_no', header: 'Invoice' },
            { key: 'dealer', header: 'Dealer', render: (r) => r.dealers?.name || 'Walk-in' },
            { key: 'total_minor', header: 'Total', render: (r) => money(r.total_minor) },
            { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
          ]}
        />
        {salesReport.length > 20 && <p className="mt-2 px-2 text-xs text-navy-400">Showing 20 of {salesReport.length} — export CSV for the full report.</p>}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">Inventory Valuation</h3>
          <Button size="sm" variant="outline" icon={Download} onClick={exportInventory}>
            Export CSV
          </Button>
        </div>
        <DataTable
          rows={inventoryReport.slice(0, 20)}
          emptyLabel="No inventory data yet"
          columns={[
            { key: 'product', header: 'Product', render: (r) => r.products?.name || '—' },
            { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouses?.name || '—' },
            { key: 'quantity', header: 'Qty' },
            { key: 'stock_value_minor', header: 'Stock Value', render: (r) => money(r.stock_value_minor) },
          ]}
        />
        {inventoryReport.length > 20 && <p className="mt-2 px-2 text-xs text-navy-400">Showing 20 of {inventoryReport.length} — export CSV for the full report.</p>}
      </Card>
    </div>
  );
}
