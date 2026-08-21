import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-teal-100 bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-0.5 font-display text-base font-bold text-teal-700">৳ {payload[0].value.toLocaleString()}</p>
    </motion.div>
  );
}

export default function SalesTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B0A2" stopOpacity={0.4} />
            <stop offset="60%" stopColor="#14B0A2" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#14B0A2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="salesStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0C716A" />
            <stop offset="100%" stopColor="#2FCBBC" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1FB" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A9BDB' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8A9BDB' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#14B0A2', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="url(#salesStroke)"
          strokeWidth={3}
          fill="url(#salesFill)"
          activeDot={{ r: 6, fill: '#0E8E83', stroke: '#fff', strokeWidth: 2 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
