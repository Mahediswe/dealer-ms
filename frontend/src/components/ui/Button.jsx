import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'relative overflow-hidden bg-brand-gradient text-white shadow-glow hover:brightness-105',
  secondary: 'bg-navy-800 text-white hover:bg-navy-700',
  outline: 'border border-navy-200 text-navy-700 hover:border-teal-300 hover:bg-teal-50/50',
  ghost: 'text-navy-600 hover:bg-navy-100/60',
  danger: 'bg-danger text-white hover:brightness-105',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled || loading}
      className={clsx(
        'group inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      )}
      <span className="relative flex items-center gap-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
        {children}
      </span>
    </motion.button>
  );
}
