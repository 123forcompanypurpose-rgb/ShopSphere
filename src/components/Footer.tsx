import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success('Subscribed for launch drops and insider pricing!');
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-surface-container-low text-on-surface-variant pt-space-xl pb-space-lg border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg pb-space-xl">
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                S
              </div>
              <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface">
                ShopSphere
              </span>
            </div>
            <p className="font-body text-body text-on-surface-variant max-w-sm text-sm">
              Contemporary apparel, designer bags, fine jewelry, and curated seasonal style. Elevate your everyday aesthetic with handpicked pieces.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-space-xs mt-space-xs">
              <span className="font-caption-medium text-caption-medium text-on-surface">
                Subscribe for new collection drops & exclusive offers
              </span>
              <div className="flex max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 h-10 px-4 bg-surface text-on-surface placeholder:text-outline font-body text-sm rounded-l-lg border border-r-0 border-line focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-primary text-on-primary font-caption-medium text-caption-medium rounded-r-lg hover:opacity-95 transition-opacity"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>

          {/* Curated Catalog */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-caption-medium text-caption-medium font-semibold text-on-surface uppercase tracking-wider text-xs">
              Curated Collections
            </span>
            <ul className="flex flex-col gap-2 font-caption text-caption">
              <li className="flex justify-between items-center pr-4">
                <Link to="/products?categoryId=2" className="hover:text-on-surface transition-colors">
                  Men's Apparel
                </Link>
                <span className="font-label-sm text-label-sm text-outline">from ₹1,299</span>
              </li>
              <li className="flex justify-between items-center pr-4">
                <Link to="/products?categoryId=3" className="hover:text-on-surface transition-colors">
                  Women's Wear
                </Link>
                <span className="font-label-sm text-label-sm text-outline">from ₹1,499</span>
              </li>
              <li className="flex justify-between items-center pr-4">
                <Link to="/products?categoryId=4" className="hover:text-on-surface transition-colors">
                  Fine Jewelry
                </Link>
                <span className="font-label-sm text-label-sm text-outline">from ₹799</span>
              </li>
              <li className="flex justify-between items-center pr-4">
                <Link to="/products?categoryId=1" className="hover:text-on-surface transition-colors">
                  Bags & Backpacks
                </Link>
                <span className="font-label-sm text-label-sm text-outline">from ₹1,899</span>
              </li>
              <li className="flex justify-between items-center pr-4">
                <Link to="/products?sort=priceAsc" className="hover:text-on-surface transition-colors">
                  Seasonal Sale
                </Link>
                <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                  Up to 40%
                </span>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-caption-medium text-caption-medium font-semibold text-on-surface uppercase tracking-wider text-xs">
              Customer Care
            </span>
            <ul className="flex flex-col gap-2 font-caption text-caption">
              <li>
                <Link to="/orders" className="hover:text-on-surface transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <span className="hover:text-on-surface transition-colors cursor-pointer">
                  Easy 7-Day Returns
                </span>
              </li>
              <li>
                <span className="hover:text-on-surface transition-colors cursor-pointer">
                  Size Guide & Fit Tips
                </span>
              </li>
              <li>
                <span className="hover:text-on-surface transition-colors cursor-pointer">
                  Shipping & Delivery Info
                </span>
              </li>
              <li>
                <span className="text-on-surface font-medium">Support:</span> support@shopsphere.com
              </li>
            </ul>
          </div>

          {/* Secure Transactions */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-caption-medium text-caption-medium font-semibold text-on-surface uppercase tracking-wider text-xs">
              Secure Transactions
            </span>
            <p className="font-caption text-caption text-on-surface-variant text-xs">
              256-bit encrypted checkout with instant UPI, Cards, NetBanking, and Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="px-2 py-1 bg-surface text-on-surface rounded border border-line font-medium">
                UPI / QR
              </span>
              <span className="px-2 py-1 bg-surface text-on-surface rounded border border-line font-medium">
                Visa / RuPay
              </span>
              <span className="px-2 py-1 bg-surface text-on-surface rounded border border-line font-medium">
                Mastercard
              </span>
              <span className="px-2 py-1 bg-surface text-on-surface rounded border border-line font-medium">
                Cash on Delivery
              </span>
            </div>
            <div className="mt-2 p-2 bg-surface rounded-lg flex items-center gap-2 border border-line text-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="font-label-sm text-label-sm text-on-surface">
                All prices inclusive of applicable taxes
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-space-md border-t border-line flex flex-col sm:flex-row items-center justify-between gap-space-sm font-caption text-caption text-outline text-xs">
          <div>© 2026 ShopSphere Fashion & Apparel Ltd. Curated contemporary fashion.</div>
          <div className="flex items-center gap-space-md">
            <span className="hover:text-on-surface transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-on-surface transition-colors cursor-pointer">Terms of Sale</span>
            <span className="hover:text-on-surface transition-colors cursor-pointer">Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
