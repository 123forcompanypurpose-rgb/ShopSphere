import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledEmail = (location.state as any)?.email || '';
  const from = (location.state as any)?.from || '/';

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    document.title = 'Sign In · ShopSphere';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!email.trim() || !password) {
      setErrorBanner('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const session = await login({ email: email.trim(), password });

      // Admin -> /admin/products, Customer -> state.from or / per spec §8
      if (session.role === 'ADMIN') {
        navigate('/admin/products', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      // 401 -> "Invalid email or password" per spec §8
      setErrorBanner(err?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl mx-auto mb-3 shadow-sm">
            S
          </div>
          <h1 className="font-headline-h2 text-2xl font-bold text-on-surface">
            Welcome to ShopSphere
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Access your orders, saved favorites & wardrobe wishlist
          </p>
        </div>

        {/* 401 Error banner per spec §8 */}
        {errorBanner && (
          <div className="mb-6 p-3.5 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-start gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorBanner}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.in"
                className="w-full h-10 pl-9 pr-3 text-sm bg-surface-container-low rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-muted"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 text-sm bg-surface-container-low rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-muted"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-caption-medium text-sm font-semibold hover:opacity-95 shadow-sm transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In to Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper
        <div className="mt-6 p-3.5 rounded-xl bg-surface-container-low border border-line text-xs">
          <p className="font-semibold text-on-surface mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Test Credentials
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEmail('john.doe@example.com');
                setPassword('Password@123');
              }}
              className="text-left py-1 px-2 rounded hover:bg-surface-container transition-colors flex justify-between items-center text-on-surface-variant hover:text-on-surface"
            >
              <span>Customer: <strong className="text-on-surface">john.doe@example.com</strong></span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@shopsphere.com');
                setPassword('Admin@123');
              }}
              className="text-left py-1 px-2 rounded hover:bg-surface-container transition-colors flex justify-between items-center text-on-surface-variant hover:text-on-surface"
            >
              <span>Admin: <strong className="text-on-surface">admin@shopsphere.com</strong></span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">Fill</span>
            </button>
          </div>
        </div>
         */}

        <div className="mt-6 pt-6 border-t border-line text-center text-xs text-on-surface-variant">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
