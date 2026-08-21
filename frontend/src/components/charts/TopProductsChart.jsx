import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const GRADIENT_IDS = ['barGrad0', 'barGrad1', 'barGrad2', 'barGrad3', 'barGrad4', 'barGrad5'];
const COLOR_PAIRS = [
  ['#0C716A', '#2FCBBC'],
  ['#14B0A2', '#63E4D5'],
  ['#232F78', '#5D6FC0'],
  ['#33409A', '#8A9BDB'],
  ['#C98B24', '#F2C572'],
  ['#0E8E83', '#9FF3E8'],
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-navy-100 bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur-sm"
    >
      <p className="text-[11px] font-semibold text-navy-700">{p.payload.name}</p>
      <p className="mt-0.5 font-display text-base font-bold text-teal-700">৳ {Number(p.value).toLocaleString()}</p>
    </motion.div>
  );
}

export default function TopProductsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          {GRADIENT_IDS.map((id, i) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLOR_PAIRS[i % COLOR_PAIRS.length][0]} />
              <stop offset="100%" stopColor={COLOR_PAIRS[i % COLOR_PAIRS.length][1]} />
            </linearGradient>
          ))}
        </defs>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#8A9BDB' }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#33409A' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,176,162,0.06)' }} />
        <Bar dataKey="revenue" radius={[0, 10, 10, 0]} animationDuration={900} animationEasing="ease-out">
          {data?.map((_, i) => (
            <Cell key={i} fill={`url(#${GRADIENT_IDS[i % GRADIENT_IDS.length]})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
