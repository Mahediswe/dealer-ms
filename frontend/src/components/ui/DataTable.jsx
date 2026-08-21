import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function DataTable({ columns, rows, keyField = 'id', onRowClick, emptyLabel = 'No records yet' }) {
  if (!rows || rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-16 text-navy-300"
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Inbox size={32} />
        </motion.div>
        <p className="text-sm font-medium text-navy-400">{emptyLabel}</p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row[keyField] ?? i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.35), duration: 0.25, ease: 'easeOut' }}
              whileHover={onRowClick ? { backgroundColor: 'rgba(20,176,162,0.06)', scale: 1.002 } : undefined}
              onClick={() => onRowClick?.(row)}
              className={'border-b border-navy-50 transition-colors ' + (onRowClick ? 'cursor-pointer' : '')}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3.5 text-navy-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
