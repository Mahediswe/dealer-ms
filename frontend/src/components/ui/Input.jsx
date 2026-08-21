import clsx from 'clsx';
import { forwardRef } from 'react';

export function Field({ label, children, className }) {
  return (
    <label className={clsx('mb-3 block', className)}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-navy-500">{label}</span>}
      {children}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-all placeholder:text-navy-300 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100',
        className
      )}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-all placeholder:text-navy-300 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100',
        className
      )}
      {...props}
    />
  );
}
