import clsx from 'clsx';
import { motion } from 'framer-motion';

const TONES = {
  success: 'bg-success/10 text-success ring-1 ring-success/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  danger: 'bg-danger/10 text-danger ring-1 ring-danger/20',
  info: 'bg-navy-500/10 text-navy-600 ring-1 ring-navy-500/10',
  teal: 'bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20',
  neutral: 'bg-navy-100 text-navy-500',
};

export default function Badge({ tone = 'neutral', pulse = false, children, className }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={clsx(
        'relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {pulse && (
        <motion.span
          className={clsx('absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full', tone === 'danger' ? 'bg-danger' : 'bg-warning')}
          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {children}
    </motion.span>
  );
}

export function statusTone(status) {
  const map = {
    paid: 'success',
    completed: 'success',
    active: 'success',
    partial: 'warning',
    pending: 'warning',
    invoiced: 'info',
    order: 'info',
    quotation: 'neutral',
    cancelled: 'danger',
    overdue: 'danger',
    unpaid: 'danger',
    inactive: 'neutral',
  };
  return map[status] || 'neutral';
}
