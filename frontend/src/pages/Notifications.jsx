import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import Card from '../components/ui/Card';
import { formatDateTime } from '../lib/format';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/notifications')
      .then(({ data }) => setItems(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold text-navy-900">Notifications</h2>
      <Card className="p-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-navy-300">
            <BellOff size={28} />
            <p className="text-sm">{loading ? 'Loading…' : 'You\u2019re all caught up'}</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-50">
            {items.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-4 py-3.5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-800">{n.title}</p>
                  {n.message && <p className="text-xs text-navy-400">{n.message}</p>}
                </div>
                <span className="shrink-0 text-xs text-navy-300">{formatDateTime(n.created_at)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
