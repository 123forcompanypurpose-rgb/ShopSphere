import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../api/types';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated, isCustomer, isAdmin } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [imgSrc, setImgSrc] = useState(
    product.imageUrl || 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg'
  );
  const [adding, setAdding] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = product.inStock === false || product.stockQuantity === 0;
  const isLowStock = !isOutOfStock && product.stockQuantity > 0 && product.stockQuantity <= 10;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    await toggleWishlist(product.id);
  };

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error(`"${product.name}" is currently out of stock`);
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    try {
      setAdding(true);
      await addItem(product.id, 1);
    } catch {
      // CartContext shows toast
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative bg-surface rounded-xl border border-line shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Top Media Frame */}
      <div className="relative aspect-square w-full bg-surface-container-low overflow-hidden flex items-center justify-center p-4">
        {/* Wishlist Heart Button (Customers and Guests only, hidden for Admins) */}
        {!isAdmin && (
          <button
            type="button"
            aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            onClick={handleWishlistClick}
            className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur-md shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
              wishlisted ? 'text-rose-600' : 'text-on-surface-variant hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                wishlisted ? 'fill-rose-600 text-rose-600 scale-110' : 'text-current'
              }`}
            />
          </button>
        )}

        {/* Stock status pill */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-rose-600/95 text-white font-label-sm text-xs font-semibold shadow-sm backdrop-blur-sm">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-amber-500/95 text-white font-label-sm text-xs font-semibold shadow-sm backdrop-blur-sm flex items-center gap-1 animate-pulse">
            ⚡ Hurry up! Only {product.stockQuantity} left
          </span>
        ) : null}

        {/* Product image */}
        <Link to={`/products/${product.id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            onError={() =>
              setImgSrc('https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg')
            }
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          {product.categoryName && (
            <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider block mb-1">
              {product.categoryName}
            </span>
          )}

          {/* Product Name */}
          <Link to={`/products/${product.id}`}>
            <h3 className="font-caption-medium text-caption-medium text-on-surface font-semibold hover:text-primary transition-colors line-clamp-2 mb-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Add to Cart button (Customers/Guests only, hidden for Admins) */}
          {!isAdmin && (
            <button
              type="button"
              disabled={isOutOfStock || adding}
              onClick={handleAddToCartClick}
              aria-label={isOutOfStock ? 'Out of Stock' : 'Add to cart'}
              className={`h-9 px-3 rounded-lg flex items-center gap-1.5 font-caption-medium text-caption-medium transition-all ${
                isOutOfStock
                  ? 'bg-surface-container text-muted cursor-not-allowed border border-line'
                  : 'bg-primary text-on-primary hover:opacity-90 shadow-sm active:scale-95'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{isOutOfStock ? 'Out of Stock' : 'Add'}</span>
            </button>
          )}

          {/* Admin Edit Link */}
          {isAdmin && (
            <Link
              to="/admin/products"
              className="h-9 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Manage
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
