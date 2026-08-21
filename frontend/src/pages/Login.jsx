import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import GradientMesh from '../components/ui/GradientMesh';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar-gradient px-4">
      <GradientMesh />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-xl2 bg-white/95 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-8 flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-glow"
          >
            <Sparkles size={22} className="text-white" />
          </motion.div>
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900">Dealer OS</h1>
            <p className="text-xs text-navy-400">Sign in to your dashboard</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <Field label="Email address">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
              <Input
                type="email"
                required
                placeholder="you@company.com"
                className="pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                className="pl-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </Field>

          <Button type="submit" loading={loading} className="mt-2 w-full" icon={ArrowRight}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-400">
          New company?{' '}
          <Link to="/register" className="font-semibold text-teal-600 hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
