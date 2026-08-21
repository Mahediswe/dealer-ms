import clsx from 'clsx';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('rounded-xl2 border border-navy-100/60 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}
