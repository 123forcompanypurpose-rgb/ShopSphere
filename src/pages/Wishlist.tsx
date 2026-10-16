import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { WishlistItem } from '../api/types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProductGridSkeleton } from '../components/Skeletons';
import {
  Heart,
  ShoppingBag,
  Trash2,
  PackageOpen,
  ArrowRight,
} from 'lucide-react';

export const Wishlist: React.FC = () => {
  const { wishlist, loading, removeItem, moveToCart, refreshWishlist } = useWishlist();

  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  React.useEffect(() => {
    document.title = 'Saved Items (Wishlist) · ShopSphere';
    refreshWishlist();
  }, [refreshWishlist]);

  const items = wishlist?.items || [];

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item.inStock) return;
    try {
      setMovingId(item.itemId);
      await moveToCart(item);
    } finally {
      setMovingId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    try {
      await removeItem(itemToRemove);
      setItemToRemove(null);
    } catch {
      // Handled in context
    }
  };

  if (loading && !wishlist) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="pb-6 border-b border-line mb-8">
          <div className="h-8 w-48 bg-surface-container rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save styles and outfits here to track availability and move to cart whenever you are ready."
          actionText="Explore Collection"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="pb-6 border-b border-line mb-8">
        <h1 className="font-headline-h2 text-3xl font-bold text-on-surface">
          Saved Favorites
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved in your wishlist
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.itemId}
            className="bg-surface rounded-2xl border border-line p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Image Frame */}
              <div className="relative aspect-square w-full bg-surface-container-low rounded-xl flex items-center justify-center p-4 mb-4 overflow-hidden">
                <img
                  src={item.imageUrl || 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg'}
                  alt={item.productName}
                  className="w-full h-full object-contain"
                />

                {!item.inStock && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold text-xs">
                    Out of Stock
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setItemToRemove(item.itemId)}
                  title="Remove from Wishlist"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center text-muted hover:text-error hover:bg-surface transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Info */}
              <Link to={`/products/${item.productId}`}>
                <h3 className="font-caption-medium text-caption-medium font-semibold text-on-surface hover:text-primary transition-colors line-clamp-2 mb-2 text-sm">
                  {item.productName}
                </h3>
              </Link>
              <div className="text-xs text-muted">
                Saved on {formatDate(item.addedAt)}
              </div>
            </div>

            {/* Price & Move to Cart Button */}
            <div className="mt-4 pt-4 border-t border-line space-y-3">
              <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface block text-lg">
                {formatCurrency(item.price)}
              </span>

              {/* Move to cart disabled when inStock === false per spec §8 */}
              <button
                type="button"
                disabled={!item.inStock || movingId === item.itemId}
                onClick={() => handleMoveToCart(item)}
                className={`w-full h-10 rounded-lg flex items-center justify-center gap-2 font-caption-medium text-caption-medium text-xs font-semibold shadow-sm transition-all ${
                  !item.inStock
                    ? 'bg-surface-container text-muted cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {!item.inStock
                  ? 'Out of Stock'
                  : movingId === item.itemId
                  ? 'Moving to Cart...'
                  : 'Move to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToRemove)}
        title="Remove Saved Item"
        message="Remove this item from your saved wishlist?"
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        onClose={() => setItemToRemove(null)}
      />
    </div>
  );
};
