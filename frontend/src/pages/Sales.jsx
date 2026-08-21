import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusTone } from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { money, formatDateTime } from '../lib/format';

const STATUSES = ['', 'quotation', 'order', 'invoiced', 'paid', 'partial', 'cancelled'];

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get('/sales', { params: { status: status || undefined, page, page_size: pageSize } })
      .then(({ data }) => {
        setSales(data.data);
        setTotal(data.total ?? data.data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => setPage(1), [status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-navy-900">All Sales</h2>
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}
              </option>
            ))}
          </Select>
          <Button icon={Plus} onClick={() => navigate('/sales/new')}>
            New Sale
          </Button>
        </div>
      </div>

      <Card className="p-2">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <DataTable
            rows={sales}
            onRowClick={(row) => navigate(`/sales/${row.id}`)}
            emptyLabel="No sales recorded yet"
            columns={[
              { key: 'invoice_no', header: 'Invoice' },
              { key: 'dealer', header: 'Dealer', render: (r) => r.dealers?.name || 'Walk-in' },
              { key: 'total_minor', header: 'Total', render: (r) => money(r.total_minor) },
              { key: 'paid_minor', header: 'Paid', render: (r) => money(r.paid_minor) },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
              { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
            ]}
          />
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </Card>
    </div>
  );
}
