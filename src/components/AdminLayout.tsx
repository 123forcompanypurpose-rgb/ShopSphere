import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Toaster } from 'sonner';
import {
  Package,
  ShoppingCart,
  Store,
  LogOut,
  Shield,
  Layers,
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-on-surface antialiased">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-line z-50 flex flex-col pt-5 pb-6">
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
              S
            </div>
            <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface tracking-tight">
              SphereHQ
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold border border-primary/20">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1.5">
          <Link
            to="/admin/products"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/admin/products'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Layers className="w-5 h-5" />
            Products & Categories
          </Link>

          <Link
            to="/admin/orders"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/admin/orders'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Order Management
          </Link>

          <div className="mt-4 pt-4 border-t border-line">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
            >
              <Store className="w-5 h-5" />
              Return to Storefront
            </Link>
          </div>
        </nav>

        {/* Admin profile footer */}
        <div className="px-4 pt-4 border-t border-line">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-sm ring-1 ring-outline-variant/40 shrink-0">
                {session?.firstName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex flex-col truncate">
                <span className="font-caption-medium text-caption-medium text-on-surface font-semibold truncate">
                  {session?.firstName || 'Admin'}
                </span>
                <span className="font-label-sm text-label-sm text-outline truncate">
                  System Admin
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-error hover:bg-error-container/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl border-b border-line z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sphere Operations</span>
            <span className="text-muted">/</span>
            <span className="text-on-surface font-semibold">Console</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 pt-16 px-6 sm:px-8 py-6">
          {children}
        </main>
      </div>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
};
