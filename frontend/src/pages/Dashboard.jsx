import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge, { statusTone } from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Input';
import { money, formatDateTime } from '../lib/format';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(14);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/sales-trend?days=14'),
      api.get('/dashboard/top-products'),
    ])
      .then(([s, t, p]) => {
        setSummary(s.data);
        setTrend(t.data.data);
        setTopProducts(p.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (trendDays === 14 && !summary) return; // covered by initial load
    setTrendLoading(true);
    api
      .get(`/dashboard/sales-trend?days=${trendDays}`)
      .then(({ data }) => setTrend(data.data))
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, [trendDays]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card className="p-5">
          <TableSkeleton rows={5} cols={4} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={money(summary?.todaysSalesTotal)}
          icon={TrendingUp}
          tone="teal"
          delay={0}
          trend={
            summary?.salesGrowthPercent != null
              ? {
                  positive: summary.salesGrowthPercent >= 0,
                  text: `${summary.salesGrowthPercent >= 0 ? '+' : ''}${summary.salesGrowthPercent.toFixed(1)}% vs yesterday`,
                }
              : null
          }
        />
        <StatCard label="Today's Purchases" value={money(summary?.todaysPurchaseTotal)} icon={Wallet} tone="navy" delay={0.05} />
        <StatCard label="Total Receivable" value={money(summary?.totalReceivable)} icon={Users} tone="gold" delay={0.1} />
        <StatCard
          label="Low Stock Items"
          value={summary?.lowStockCount ?? 0}
          icon={AlertTriangle}
          tone="danger"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-navy-900">Sales Trend</h3>
            <Select value={trendDays} onChange={(e) => setTrendDays(Number(e.target.value))} className="w-32 py-1.5 text-xs">
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </Select>
          </div>
          {trendLoading ? <TableSkeleton rows={4} cols={1} /> : <SalesTrendChart data={trend} />}
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy-900">Top Products</h3>
          <TopProductsChart data={topProducts} />
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">Recent Sales</h3>
        </div>
        <DataTable
          rows={summary?.recentSales || []}
          columns={[
            { key: 'invoice_no', header: 'Invoice' },
            { key: 'dealer', header: 'Dealer', render: (r) => r.dealers?.name || '—' },
            { key: 'total_minor', header: 'Amount', render: (r) => money(r.total_minor) },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
            { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
          ]}
          emptyLabel={loading ? 'Loading…' : 'No sales recorded yet'}
        />
      </Card>
    </div>
  );
}
