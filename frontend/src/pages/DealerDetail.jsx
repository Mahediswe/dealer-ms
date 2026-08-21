import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MapPin, CreditCard } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Badge, { statusTone } from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { money, formatDate, initials } from '../lib/format';

export default function DealerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('sales');

  useEffect(() => {
    api
      .get(`/dealers/${id}/360`)
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, [id]);

  if (!data) return <p className="text-navy-400">Loading dealer profile…</p>;
  const { profile, sales, payments, ledger } = data;

  return (
    <div className="space-y-5">
      <Link to="/dealers" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-teal-600">
        <ArrowLeft size={15} /> Back to Dealers
      </Link>

      <Card className="overflow-hidden p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white shadow-glow"
            >
              <motion.span
                className="absolute inset-0 rounded-2xl"
                animate={{ boxShadow: ['0 0 0px rgba(20,176,162,0.5)', '0 0 24px rgba(20,176,162,0.5)', '0 0 0px rgba(20,176,162,0.5)'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative">{initials(profile.name)}</span>
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">{profile.name}</h2>
              <p className="text-sm text-navy-400">{profile.business_name || profile.dealer_code}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-navy-500">
                <span className="flex items-center gap-1"><Phone size={12} /> {profile.phone}</span>
                {profile.address && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.address}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-navy-400">Balance Due</p>
              <p className="font-display text-lg font-bold text-danger">
                ৳ <AnimatedNumber value={profile.current_balance_minor / 100} />
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-navy-400">Credit Limit</p>
              <p className="font-display text-lg font-bold text-navy-800">{money(profile.credit_limit_minor)}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex gap-1 border-b border-navy-100 px-3 pt-2">
          {['sales', 'payments', 'ledger'].map((t) => (
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

        {tab === 'sales' && (
          <DataTable
            rows={sales}
            emptyLabel="No sales for this dealer yet"
            columns={[
              { key: 'invoice_no', header: 'Invoice' },
              { key: 'total_minor', header: 'Amount', render: (r) => money(r.total_minor) },
              { key: 'paid_minor', header: 'Paid', render: (r) => money(r.paid_minor) },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
              { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
            ]}
          />
        )}
        {tab === 'payments' && (
          <DataTable
            rows={payments}
            emptyLabel="No payments recorded yet"
            columns={[
              { key: 'receipt_no', header: 'Receipt' },
              { key: 'amount_minor', header: 'Amount', render: (r) => money(r.amount_minor) },
              { key: 'method', header: 'Method', render: (r) => <Badge tone="info">{r.method}</Badge> },
              { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
            ]}
          />
        )}
        {tab === 'ledger' && (
          <DataTable
            rows={ledger}
            emptyLabel="No ledger entries yet"
            columns={[
              { key: 'description', header: 'Description' },
              { key: 'entry_type', header: 'Type', render: (r) => <Badge tone={r.entry_type === 'debit' ? 'danger' : 'success'}>{r.entry_type}</Badge> },
              { key: 'amount_minor', header: 'Amount', render: (r) => money(r.amount_minor) },
              { key: 'balance_after_minor', header: 'Balance', render: (r) => money(r.balance_after_minor) },
              { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at) },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
