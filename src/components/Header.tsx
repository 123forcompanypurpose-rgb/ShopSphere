import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ThemeToggle } from './ThemeToggle';
import {
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Package,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { session, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist?.itemCount ?? 0;

  const [keyword, setKeyword] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-line">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-space-md">
        {/* Brand & Desktop Nav */}
        <div className="flex items-center gap-space-lg">
          <Link to="/" className="flex items-center gap-space-xs group">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold shadow-sm">
              S
            </div>
            <span className="font-headline-h3 text-headline-h3 font-bold tracking-tight text-on-surface">
              ShopSphere
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-space-md">
            <Link
              to="/products"
              className={`font-caption-medium text-caption-medium py-1 transition-colors ${
                location.pathname === '/products' && !location.search
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Styles
            </Link>
            <Link
              to="/products?categoryId=2"
              className="font-caption-medium text-caption-medium text-on-surface-variant hover:text-on-surface transition-colors py-1"
            >
              Men's Wear
            </Link>
            <Link
              to="/products?categoryId=3"
              className="font-caption-medium text-caption-medium text-on-surface-variant hover:text-on-surface transition-colors py-1"
            >
              Women's Wear
            </Link>
            <Link
              to="/products?categoryId=4"
              className="font-caption-medium text-caption-medium text-on-surface-variant hover:text-on-surface transition-colors py-1"
            >
              Jewelry
            </Link>
            <Link
              to="/products?categoryId=1"
              className="font-caption-medium text-caption-medium text-on-surface-variant hover:text-on-surface transition-colors py-1"
            >
              Bags & Backpacks
            </Link>
            <Link
              to="/products?sort=priceAsc"
              className="font-caption-medium text-caption-medium text-on-surface-variant hover:text-on-surface transition-colors py-1"
            >
              Sale
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block mx-space-sm">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 absolute left-3 text-on-surface-variant pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search apparel, jackets, jewelry, bags..."
              className="w-full h-10 pl-10 pr-14 bg-surface-container-low text-on-surface placeholder:text-outline font-body text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary"
            />
            <span className="absolute right-2.5 px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-label-sm text-label-sm rounded border border-outline-variant/30 pointer-events-none select-none">
              ⌘K
            </span>
          </div>
        </form>

        {/* Right Action Icons & Auth Profile */}
        <div className="flex items-center gap-space-sm">
          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Wishlist Link (Customers only, hidden for Admins) */}
          {(!isAuthenticated || isCustomer) && (
            <Link
              to={isAuthenticated ? '/wishlist' : '/login?from=%2Fwishlist'}
              aria-label="Wishlist"
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <Heart className="w-5 h-5" />
              {isCustomer && wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Cart Link (Customers only, hidden for Admins, badge hides when 0) */}
          {(!isAuthenticated || isCustomer) && (
            <Link
              to={isAuthenticated ? '/cart' : '/login?from=%2Fcart'}
              aria-label="Shopping Cart"
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {isCustomer && cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-primary text-on-primary font-label-sm text-label-sm rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Admin Direct Access Pill */}
          {isAdmin && (
            <Link
              to="/admin/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-caption-medium text-caption-medium transition-colors border border-primary/20"
            >
              <Shield className="w-4 h-4" />
              Admin Console
            </Link>
          )}

          {/* User Profile / Menu */}
          {isAuthenticated && session ? (
            <div className="relative pl-space-xs" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-space-xs p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-semibold flex items-center justify-center text-xs ring-1 ring-outline-variant/40">
                  {session.firstName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="font-caption-medium text-caption-medium text-on-surface leading-tight">
                    {session.firstName}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                    {session.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-xl p-space-sm border border-line z-50">
                  <div className="px-3 py-2 border-b border-line">
                    <p className="font-caption-medium text-caption-medium text-on-surface font-semibold">
                      {session.firstName}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant truncate">
                      {session.email}
                    </p>
                  </div>

                  <div className="py-1 border-b border-line">
                    {isCustomer && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          Profile & Addresses
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Order History
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Saved Items
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/products"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Manage Products
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Manage Orders
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-caption-medium text-caption-medium text-error hover:bg-error-container/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-space-xs">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg font-caption-medium text-caption-medium text-on-surface hover:bg-surface-container transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-caption-medium text-caption-medium hover:opacity-90 shadow-sm transition-opacity"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
