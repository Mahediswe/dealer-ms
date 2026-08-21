import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';

const TONE_GRADIENTS = {
  teal: 'from-teal-400 via-teal-500 to-teal-600',
  navy: 'from-navy-500 via-navy-700 to-navy-900',
  gold: 'from-gold-400 via-gold-500 to-gold-600',
  danger: 'from-red-400 via-danger to-red-700',
};

const GLOW = {
  teal: 'shadow-[0_0_40px_-8px_rgba(20,176,162,0.45)]',
  navy: 'shadow-[0_0_40px_-8px_rgba(35,47,120,0.4)]',
  gold: 'shadow-[0_0_40px_-8px_rgba(229,172,61,0.45)]',
  danger: 'shadow-[0_0_40px_-8px_rgba(220,38,38,0.4)]',
};

export default function StatCard({ label, value, icon: Icon, trend, tone = 'teal', delay = 0, isCurrency = false, prefix = '' }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-40, 40], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-40, 40], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left - rect.width / 2);
    my.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // Parse numeric value out of a formatted currency string like "৳ 12,345"
  const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, '')) || 0;
  const prefixMatch = typeof value === 'string' ? value.match(/^[^\d-]*/)?.[0] ?? '' : prefix;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 900 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.02 }}
        className="relative"
      >
        <Card className={clsx('relative overflow-hidden border-navy-100/50 p-5 transition-shadow duration-300 hover:shadow-none', GLOW[tone])}>
          {/* animated gradient blob */}
          <motion.div
            className={clsx('pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-[0.14] blur-xl', TONE_GRADIENTS[tone])}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* subtle shimmer sweep */}
          <motion.div
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ translateX: ['-100%', '220%'] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />

          <div className="relative flex items-start justify-between" style={{ transform: 'translateZ(20px)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-navy-900">
                {prefixMatch}
                <AnimatedNumber value={numericValue} formatter={(v) => Math.round(v).toLocaleString()} />
              </p>
              {trend && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.3 }}
                  className={clsx('mt-1 flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-success' : 'text-danger')}
                >
                  {trend.text}
                </motion.p>
              )}
            </div>
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft', TONE_GRADIENTS[tone])}
            >
              {Icon && <Icon size={20} />}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
