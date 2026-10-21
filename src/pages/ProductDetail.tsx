import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { productsApi } from '../api/products';
import { reviewsApi, CreateReviewDto } from '../api/reviews';
import { Product, Review, ReviewSummary, ApiError } from '../api/types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { QuantityStepper } from '../components/QuantityStepper';
import { StarRating } from '../components/StarRating';
import { ConfirmModal } from '../components/ConfirmModal';
import { ErrorState } from '../components/ErrorState';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Cpu,
  BatteryCharging,
  Headphones,
  Check,
  AlertCircle,
  MessageSquare,
  Trash2,
  Edit2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { session, isAuthenticated, isCustomer, isAdmin } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const navigate = useNavigate();
  const location = useLocation();

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Reviews state (loaded separately per spec §8)
  const [reviewsSummary, setReviewsSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Purchasing UI State
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Matte Black');
  const [activeImage, setActiveImage] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewBanner, setReviewBanner] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

  // Editing review state
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

  // Fetch product
  const loadProduct = async () => {
    try {
      setProductLoading(true);
      setProductError(null);
      const res = await productsApi.getProductById(productId);
      setProduct(res);
      setActiveImage(res.imageUrl || 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg');
      document.title = `${res.name} · ShopSphere`;
    } catch (err: any) {
      if (err?.status === 404) {
        setProductError('Product not found');
      } else {
        setProductError(err?.message || 'Failed to load product details');
      }
    } finally {
      setProductLoading(false);
    }
  };

  // Fetch reviews separately
  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const res = await reviewsApi.getProductReviews(productId);
      setReviewsSummary(res);
    } catch (err: any) {
      setReviewsError(err?.message || 'Could not load community reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadReviews();
    }
  }, [productId]);

  // Compute rating distribution client-side from reviews list per spec §8
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviewsSummary?.reviews?.length) return counts;

    reviewsSummary.reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviewsSummary]);

  const wishlisted = product ? isWishlisted(product.id) : false;
  const isOutOfStock = product ? product.inStock === false || product.stockQuantity === 0 : false;
  const isLowStock = product ? !isOutOfStock && product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity <= 10 : false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (!product) return;
    if (isOutOfStock) {
      toast.error(`"${product.name}" is currently out of stock`);
      return;
    }

    try {
      setAddingToCart(true);
      await addItem(product.id, quantity);
    } catch {
      // CartContext handles friendly error toasts
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (!product) return;
    await toggleWishlist(product.id);
  };

  // Submit / Update Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomer) return;

    try {
      setSubmittingReview(true);
      setReviewBanner(null);

      if (editingReviewId) {
        await reviewsApi.updateReview(editingReviewId, {
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        });
        toast.success('Review updated successfully');
        setEditingReviewId(null);
      } else {
        await reviewsApi.createReview({
          productId,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        });
        toast.success('Review submitted successfully');
      }

      setReviewComment('');
      setReviewRating(5);
      await loadReviews();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 403) {
        setReviewBanner({
          type: 'info',
          message: apiErr?.message || 'You can only review products you have received',
        });
        toast.info(apiErr?.message || 'You can only review products you have received');
      } else if (apiErr?.status === 409) {
        setReviewBanner({
          type: 'error',
          message: apiErr?.message || "You've already reviewed this product",
        });
        toast.error(apiErr?.message || "You've already reviewed this product");
      } else {
        toast.error(apiErr?.message || 'Failed to submit review');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeletingReview(true);
      await reviewsApi.deleteReview(deleteConfirmId);
      toast.success('Review deleted');
      setDeleteConfirmId(null);
      await loadReviews();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete review');
    } finally {
      setDeletingReview(false);
    }
  };

  const startEditReview = (rev: Review) => {
    setEditingReviewId(rev.reviewId);
    setReviewRating(rev.rating);
    setReviewComment(rev.comment || '');
    window.scrollTo({ top: document.getElementById('review-form')?.offsetTop || 0, behavior: 'smooth' });
  };

  if (productLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/3] bg-surface-container rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 w-1/4 bg-surface-container rounded" />
            <div className="h-10 w-3/4 bg-surface-container rounded" />
            <div className="h-8 w-1/3 bg-surface-container rounded" />
            <div className="h-32 bg-surface-container rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState message={productError || 'Product not found'} onRetry={loadProduct} />
        <div className="text-center mt-4">
          <Link to="/products" className="text-primary hover:underline font-medium text-sm">
            ← Return to Fashion Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-72 left-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {/* Breadcrumb & Fulfillment Pill */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-caption text-caption text-on-surface-variant text-xs sm:text-sm">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-outline" />
            <Link to="/products" className="hover:text-primary transition-colors">
              Collection
            </Link>
            {product.categoryName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-outline" />
                <Link
                  to={`/products?categoryId=${product.categoryId}`}
                  className="hover:text-primary transition-colors"
                >
                  {product.categoryName}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-outline" />
            <span className="font-caption-medium text-on-surface truncate max-w-xs font-semibold">
              {product.name}
            </span>
          </nav>

          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full text-on-surface font-label-sm text-label-sm text-xs border border-line">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span>Ready to Ship: Express Dispatch Available</span>
          </div>
        </div>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Gallery & Badges */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="relative bg-surface rounded-2xl p-6 border border-line shadow-sm overflow-hidden group">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="px-2.5 py-1 bg-surface-container text-primary font-label-sm text-label-sm rounded-full font-semibold uppercase tracking-wider text-xs">
                  Featured Style
                </span>
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 bg-rose-600 text-white font-label-sm text-label-sm rounded-full font-semibold text-xs shadow-sm">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-2.5 py-1 bg-amber-500 text-white font-label-sm text-label-sm rounded-full font-semibold text-xs flex items-center gap-1 shadow-sm animate-pulse">
                    ⚡ Hurry up! Only {product.stockQuantity} left
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-secondary-container/20 text-on-secondary-container font-label-sm text-label-sm rounded-full font-semibold text-xs">
                    In Stock
                  </span>
                )}
              </div>

              {/* Main Media Frame */}
              <div className="w-full aspect-square md:aspect-[4/3] flex items-center justify-center p-6 bg-surface-container-low rounded-xl overflow-hidden relative">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-500 transform group-hover:scale-105"
                  onError={() =>
                    setActiveImage('https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg')
                  }
                />
              </div>

              {/* Color Variant Strip */}
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1">
                {['Classic Black', 'Indigo Blue', 'Heather Grey'].map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedColor(variant)}
                    className={`flex-1 min-w-[80px] p-2 bg-surface-container-low rounded-lg transition-all focus:outline-none border ${
                      selectedColor === variant ? 'ring-2 ring-primary border-transparent' : 'border-line'
                    }`}
                  >
                    <div className="w-full h-12 bg-surface rounded flex items-center justify-center mb-1 overflow-hidden">
                      <img
                        src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg"
                        alt={variant}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="block text-center font-label-sm text-label-sm text-on-surface truncate text-xs">
                      {variant}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Assurance Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-1 items-start">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-caption-medium text-caption-medium text-on-surface font-semibold text-sm">
                  Premium Quality
                </span>
                <span className="font-caption text-caption text-on-surface-variant text-xs">
                  Carefully chosen fabrics & durable finishes
                </span>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-1 items-start">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-caption-medium text-caption-medium text-on-surface font-semibold text-sm">
                  Verified Authentic
                </span>
                <span className="font-caption text-caption text-on-surface-variant text-xs">
                  100% genuine guaranteed with quality checks
                </span>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-1 items-start">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-1">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="font-caption-medium text-caption-medium text-on-surface font-semibold text-sm">
                  Easy Exchanges
                </span>
                <span className="font-caption text-caption text-on-surface-variant text-xs">
                  7-day hassle-free size & style swaps
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Purchasing Panel & Details */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-line shadow-sm flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold text-xs">
                    {product.categoryName || 'Curated Fashion'}
                  </span>
                  {!isAdmin && (
                    <button
                      type="button"
                      aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      onClick={handleWishlistToggle}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                        wishlisted
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-rose-600'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all duration-200 ${
                          wishlisted ? 'fill-rose-600 text-rose-600 scale-110' : 'text-current'
                        }`}
                      />
                    </button>
                  )}
                </div>

                <h1 className="font-headline-h2 text-2xl sm:text-3xl font-bold text-on-surface">
                  {product.name}
                </h1>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-line flex items-baseline justify-between">
                <div>
                  <span className="font-headline-h2 text-3xl font-bold text-on-surface">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="block text-xs text-muted mt-0.5">
                    Includes all taxes and GST (18%)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-success/15 text-success font-label-sm text-xs font-semibold">
                  Free Express Shipping
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-caption-medium text-caption-medium font-semibold text-on-surface mb-1.5 text-sm">
                  Product Details & Fit
                </h3>
                <p className="font-body text-body text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Purchasing Controls (Customers and Guests only) */}
              {!isAdmin && (
                <div className="pt-4 border-t border-line space-y-4">
                  {isLowStock && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm font-medium">
                      <span className="text-xl">⚡</span>
                      <div>
                        <strong className="font-semibold text-amber-900 dark:text-amber-200">
                          Hurry up! Only {product.stockQuantity} left in stock
                        </strong>
                        <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                          High demand item. Complete your order soon before it sells out!
                        </p>
                      </div>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm font-medium">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <strong className="font-semibold text-rose-900 dark:text-rose-200">
                          This product is currently out of stock
                        </strong>
                        <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mt-0.5">
                          We are working to restock soon. Please check back later or explore other styles!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-on-surface">Select Quantity</span>
                    <QuantityStepper
                      value={quantity}
                      min={1}
                      max={Math.max(1, Math.min(product.stockQuantity || 1, 99))}
                      disabled={isOutOfStock}
                      onChange={setQuantity}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock || addingToCart}
                    onClick={handleAddToCart}
                    className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-caption-medium text-caption-medium text-base font-semibold shadow-md transition-all ${
                      isOutOfStock
                        ? 'bg-surface-container text-muted cursor-not-allowed border border-line'
                        : 'bg-primary text-on-primary hover:opacity-95 active:scale-[0.98]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {isOutOfStock
                      ? 'Out of Stock'
                      : addingToCart
                      ? 'Adding to Cart...'
                      : `Add ${quantity} to Cart • ${formatCurrency(product.price * quantity)}`}
                  </button>
                </div>
              )}

              {/* Admin note */}
              {isAdmin && (
                <div className="p-3 bg-surface-container rounded-lg border border-line text-xs text-muted">
                  You are viewing this product in Admin Mode. Add-to-cart and wishlist controls are disabled for administrator sessions.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Separated Reviews Section per spec §8 */}
        <section className="mt-16 pt-12 border-t border-line">
          <div className="mb-8">
            <h2 className="font-headline-h2 text-2xl font-bold text-on-surface flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Verified Community Feedback
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Independent reviews from registered customers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Reviews Summary & Rating Distribution */}
            <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-6 shadow-sm">
              {reviewsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-1/3 bg-surface-container rounded" />
                  <div className="h-4 w-1/2 bg-surface-container rounded" />
                </div>
              ) : reviewsError ? (
                <div className="text-sm text-muted">Unable to load reviews breakdown.</div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-4xl font-bold text-on-surface">
                      {reviewsSummary?.averageRating?.toFixed(1) || '—'}
                    </span>
                    <div>
                      <StarRating rating={reviewsSummary?.averageRating || 0} />
                      <span className="text-xs text-muted block mt-1">
                        Based on {reviewsSummary?.reviewCount || 0} reviews
                      </span>
                    </div>
                  </div>

                  {/* Rating Distribution Bars computed client-side */}
                  <div className="space-y-2 pt-4 border-t border-line">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = (ratingDistribution as any)[stars] || 0;
                      const total = reviewsSummary?.reviewCount || 0;
                      const percentage = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-8 text-on-surface-variant font-medium">{stars} star</span>
                          <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-outline">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review Submission Form / Guest Banner */}
              <div id="review-form" className="mt-8 pt-6 border-t border-line">
                <h3 className="font-caption-medium text-caption-medium font-bold text-on-surface mb-3">
                  {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                </h3>

                {reviewBanner && (
                  <div
                    className={`p-3 rounded-lg mb-4 text-xs flex items-start gap-2 ${
                      reviewBanner.type === 'info'
                        ? 'bg-info/10 text-info border border-info/20'
                        : 'bg-error-container/20 text-error border border-error/20'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{reviewBanner.message}</span>
                  </div>
                )}

                {isCustomer ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Your Rating
                      </label>
                      <StarRating
                        rating={reviewRating}
                        interactive
                        size="lg"
                        onChange={setReviewRating}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Feedback (Optional, max 1000 characters)
                      </label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this item, fit, and material..."
                        className="w-full p-3 text-xs bg-surface-container-low rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-muted"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="h-9 px-4 rounded-lg bg-primary text-on-primary font-caption-medium text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {submittingReview
                          ? 'Submitting...'
                          : editingReviewId
                          ? 'Update Review'
                          : 'Submit Review'}
                      </button>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setReviewComment('');
                            setReviewRating(5);
                          }}
                          className="h-9 px-3 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : isAuthenticated ? (
                  <div className="p-3 bg-surface-container rounded-lg text-xs text-muted">
                    Reviews can only be submitted by customer accounts.
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-container-low border border-line text-center">
                    <p className="text-xs text-on-surface-variant mb-3">
                      Log in to share your experience with this verified product.
                    </p>
                    <Link
                      to={`/login?from=${encodeURIComponent(location.pathname)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-caption-medium text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Log in to write a review
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-28 bg-surface-container rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : reviewsError ? (
                <ErrorState message={reviewsError} onRetry={loadReviews} />
              ) : !reviewsSummary?.reviews?.length ? (
                <div className="p-8 text-center bg-surface rounded-xl border border-line">
                  <p className="text-muted text-sm">
                    No community reviews recorded yet. Be the first customer to review!
                  </p>
                </div>
              ) : (
                reviewsSummary.reviews.map((rev) => {
                  const isOwnReview = session?.userId === rev.userId;

                  return (
                    <div
                      key={rev.reviewId}
                      className="p-5 bg-surface border border-line rounded-xl shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-caption-medium text-caption-medium font-semibold text-on-surface">
                              {rev.userName || 'Verified Buyer'}
                            </span>
                            {isOwnReview && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted block mt-0.5">
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <StarRating rating={rev.rating} size="sm" />
                          {/* Own Review Edit/Delete per spec §8 */}
                          {isOwnReview && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => startEditReview(rev)}
                                title="Edit review"
                                className="p-1 rounded text-muted hover:text-on-surface hover:bg-surface-container transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(rev.reviewId)}
                                title="Delete review"
                                className="p-1 rounded text-muted hover:text-error hover:bg-error-container/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="font-body text-body text-on-surface-variant text-sm mt-2 leading-relaxed">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Delete Review Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="Delete Review"
        message="Are you sure you want to remove your review for this product? This cannot be undone."
        confirmText="Delete Review"
        loading={deletingReview}
        onConfirm={handleDeleteReview}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
