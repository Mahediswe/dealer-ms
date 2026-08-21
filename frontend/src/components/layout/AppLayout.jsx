import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveNotifications } from '../../hooks/useLiveNotifications.jsx';

const TITLES = {
  '/': 'Dashboard',
  '/dealers': 'Dealers',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/sales': 'Sales',
  '/purchases': 'Purchases',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/salesmen': 'Sales Team',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const base = '/' + (location.pathname.split('/')[1] || '');
  const title = TITLES[base] ?? TITLES[location.pathname] ?? 'Dealer OS';

  useLiveNotifications(() => setUnreadCount((c) => c + 1));

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          onOpenMobileMenu={() => setMobileOpen(true)}
          unreadCount={unreadCount}
          onOpenNotifications={() => setUnreadCount(0)}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
