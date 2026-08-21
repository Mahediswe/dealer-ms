import { Bell, Search, LogOut, ChevronDown, Menu, User, Package, Receipt } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { initials, money } from '../../lib/format';
import api from '../../lib/api';

export default function Topbar({ title, onOpenMobileMenu, unreadCount = 0, onOpenNotifications }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      api.get('/search', { params: { q: query } }).then(({ data }) => setResults(data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goTo = (path) => {
    setSearchOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = results && (results.dealers.length || results.products.length || results.sales.length);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-navy-100 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobileMenu} className="rounded-xl p-2 text-navy-500 hover:bg-navy-50 md:hidden">
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-bold text-navy-900 sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div ref={boxRef} className="relative hidden sm:block">
          <div className="flex items-center gap-2 rounded-xl border border-navy-100 bg-navy-50/60 px-3.5 py-2 text-sm text-navy-400">
            <Search size={16} />
            <input
              ref={inputRef}
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dealers, products, invoices…"
              className="w-56 bg-transparent outline-none placeholder:text-navy-300"
            />
            <kbd className="hidden rounded border border-navy-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-navy-400 lg:inline-block">
              ⌘K
            </kbd>
          </div>
          <AnimatePresence>
            {searchOpen && query.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 mt-2 w-80 rounded-xl border border-navy-100 bg-white p-2 shadow-card"
              >
                {!hasResults && <p className="px-3 py-4 text-center text-sm text-navy-300">No matches found</p>}
                {results?.dealers?.map((d) => (
                  <button key={d.id} onClick={() => goTo(`/dealers/${d.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-navy-50">
                    <User size={14} className="text-navy-400" />
                    <span className="flex-1 truncate text-navy-700">{d.name}</span>
                    <span className="text-xs text-navy-300">{d.dealer_code}</span>
                  </button>
                ))}
                {results?.products?.map((p) => (
                  <button key={p.id} onClick={() => goTo('/products')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-navy-50">
                    <Package size={14} className="text-navy-400" />
                    <span className="flex-1 truncate text-navy-700">{p.name}</span>
                    <span className="text-xs text-navy-300">{p.sku}</span>
                  </button>
                ))}
                {results?.sales?.map((s) => (
                  <button key={s.id} onClick={() => goTo(`/sales/${s.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-navy-50">
                    <Receipt size={14} className="text-navy-400" />
                    <span className="flex-1 truncate text-navy-700">{s.invoice_no}</span>
                    <span className="text-xs text-navy-300">{money(s.total_minor)}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="relative rounded-xl p-2.5 text-navy-500 hover:bg-navy-50"
          onClick={() => {
            onOpenNotifications?.();
            navigate('/notifications');
          }}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-navy-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white">
              {initials(user?.name || 'U')}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-navy-800">{user?.name}</p>
              <p className="text-xs capitalize text-navy-400">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={16} className="hidden text-navy-400 sm:block" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 mt-2 w-44 rounded-xl border border-navy-100 bg-white p-1.5 shadow-card"
              >
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5">
                  <LogOut size={15} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
