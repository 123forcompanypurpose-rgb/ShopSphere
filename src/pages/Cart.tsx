import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { QuantityStepper } from '../components/QuantityStepper';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, loading, updateItemQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);

  React.useEffect(() => {
    document.title = 'Shopping Cart · ShopSphere';
  }, []);

  const items = cart?.items || [];
  const hasUnavailableItems = items.some((item) => !item.available);
  const isCartEmpty = items.length === 0;

  const handleClearCart = async () => {
    try {
      setClearing(true);
      await clearCart();
      setClearModalOpen(false);
    } finally {
      setClearing(false);
    }
  };

  const handleRemoveSingle = async () => {
    if (!itemToRemove) return;
    try {
      await removeItem(itemToRemove);
      setItemToRemove(null);
    } catch {
      // toast is handled in context
    }
  };

  if (!loading && isCartEmpty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any items to your shopping cart yet."
          actionText="Explore Collection"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Page Title & Clear Cart Header */}
      <div className="flex items-center justify-between pb-6 border-b border-line mb-8">
        <div>
          <h1 className="font-headline-h2 text-3xl font-bold text-on-surface">
            Shopping Cart
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Review your items before secure checkout
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setClearModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        )}
      </div>

      {/* Unavailable Items Warning Banner */}
      {hasUnavailableItems && (
        <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-start gap-3 text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Some items in your cart are no longer available</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Please remove the greyed-out unavailable items below to proceed to checkout.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isAvailable = item.available;

            return (
              <div
                key={item.itemId}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center gap-5 ${
                  isAvailable
                    ? 'bg-surface border-line shadow-sm'
                    : 'bg-surface-container-low/60 border-dashed border-error/30 opacity-75'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="w-24 h-24 rounded-xl bg-surface-container-low flex items-center justify-center p-2 shrink-0 border border-line">
                  <img
                    src={item.imageUrl || 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg'}
                    alt={item.productName}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Info & Title */}
                <div className="flex-1 text-center sm:text-left">
                  <Link
                    to={`/products/${item.productId}`}
                    className="font-caption-medium text-caption-medium font-bold text-on-surface hover:text-primary transition-colors text-base line-clamp-1"
                  >
                    {item.productName}
                  </Link>

                  <div className="text-xs text-muted mt-1">
                    Unit Price: {formatCurrency(item.unitPrice)}
                  </div>

                  {!isAvailable && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold">
                      No longer available
                    </span>
                  )}
                </div>

                {/* Quantity Stepper & Line Total */}
                <div className="flex items-center gap-6">
                  {isAvailable ? (
                    <QuantityStepper
                      value={item.quantity}
                      min={1}
                      max={99}
                      onChange={(newQty) => updateItemQuantity(item.itemId, newQty)}
                    />
                  ) : (
                    <span className="text-xs text-muted italic">Unavailable</span>
                  )}

                  <div className="text-right min-w-[90px]">
                    <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface block">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setItemToRemove(item.itemId)}
                    title="Remove item"
                    className="p-2 rounded-lg text-muted hover:text-error hover:bg-error-container/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-6 shadow-sm space-y-5 sticky top-24">
          <h3 className="font-headline-h3 text-headline-h3 font-bold text-on-surface pb-3 border-b border-line">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Items Total ({cart?.itemCount || 0})</span>
              <span>{formatCurrency(cart?.subtotal || 0)}</span>
            </div>

            <div className="flex justify-between text-on-surface-variant">
              <span>Standard Dispatch</span>
              <span className="text-success font-semibold">Free</span>
            </div>

            <div className="flex justify-between text-on-surface-variant">
              <span>Estimated GST (18%)</span>
              <span className="text-outline">Included</span>
            </div>

            <div className="pt-3 border-t border-line flex justify-between font-bold text-lg text-on-surface">
              <span>Subtotal</span>
              <span className="text-primary">{formatCurrency(cart?.subtotal || 0)}</span>
            </div>
          </div>

          {/* Checkout Button per spec §8 */}
          <div className="pt-2">
            <button
              type="button"
              disabled={hasUnavailableItems || isCartEmpty}
              onClick={() => navigate('/checkout')}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-caption-medium text-caption-medium font-semibold shadow-md transition-all ${
                hasUnavailableItems || isCartEmpty
                  ? 'bg-surface-container text-muted cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:opacity-95 active:scale-[0.98]'
              }`}
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasUnavailableItems && (
              <p className="text-[11px] text-error text-center mt-2">
                Remove unavailable items to continue
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-line text-xs text-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Encrypted 256-bit checkout with instant UPI & card verification.</span>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={clearModalOpen}
        title="Clear Shopping Cart"
        message="Are you sure you want to remove all items from your shopping cart? This action cannot be reversed."
        confirmText="Clear Cart"
        loading={clearing}
        onConfirm={handleClearCart}
        onClose={() => setClearModalOpen(false)}
      />

      {/* Remove Single Item Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToRemove)}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        confirmText="Remove"
        onConfirm={handleRemoveSingle}
        onClose={() => setItemToRemove(null)}
      />
    </div>
  );
};
