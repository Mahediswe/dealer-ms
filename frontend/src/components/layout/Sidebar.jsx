import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Wallet,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dealers', label: 'Dealers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/purchases', label: 'Purchases', icon: Truck },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/salesmen', label: 'Sales Team', icon: UserCog },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Brand({ collapsed }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <motion.div
        animate={{ boxShadow: ['0 0 0px rgba(47,203,188,0.5)', '0 0 22px rgba(47,203,188,0.55)', '0 0 0px rgba(47,203,188,0.5)'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600"
      >
        <Sparkles size={20} />
      </motion.div>
      {!collapsed && (
        <div className="overflow-hidden">
          <p className="font-display text-base font-bold leading-tight">Dealer OS</p>
          <p className="text-[11px] font-medium text-teal-300/80">Business Management</p>
        </div>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }) {
  return (
    <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/25 to-teal-400/10 shadow-[inset_0_0_0_1px_rgba(47,203,188,0.35)]"
                />
              )}
              <Icon size={18} className={clsx('relative', isActive ? 'text-teal-300' : 'text-navy-300 group-hover:text-teal-300')} />
              {!collapsed && <span className="relative truncate">{label}</span>}
              {isActive && !collapsed && <motion.span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-teal-300" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 264 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="relative hidden shrink-0 flex-col overflow-hidden bg-sidebar-gradient text-white md:flex"
      >
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mx-3 mb-5 flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs font-semibold text-navy-200 hover:bg-white/5"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && 'Collapse'}
        </button>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar-gradient text-white md:hidden"
            >
              <div className="flex items-center justify-between pr-4">
                <Brand collapsed={false} />
                <button onClick={onCloseMobile} className="rounded-lg p-2 text-navy-200 hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <NavList collapsed={false} onNavigate={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
