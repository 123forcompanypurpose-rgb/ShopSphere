import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Wishlist, WishlistItem } from '../api/types';
import { wishlistApi } from '../api/wishlist';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlist: Wishlist | null;
  wishlistIds: Set<number>;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
  toggleWishlist: (productId: number | string) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  moveToCart: (item: WishlistItem) => Promise<void>;
  isWishlisted: (productId: number | string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const isCustomer = isAuthenticated && !isAdmin;
  const { refreshCart } = useCart();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [optimisticIds, setOptimisticIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Sync optimisticIds when wishlist changes
  useEffect(() => {
    if (wishlist?.items) {
      setOptimisticIds(new Set(wishlist.items.map((i) => Number(i.productId))));
    } else {
      setOptimisticIds(new Set());
    }
  }, [wishlist]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || isAdmin) {
      setWishlist(null);
      return;
    }
    try {
      setLoading(true);
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
    } catch (err) {
      console.warn('Wishlist load warning:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      refreshWishlist();
    } else {
      setWishlist(null);
      setOptimisticIds(new Set());
    }
  }, [isAuthenticated, isAdmin, refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: number | string): boolean => {
      return optimisticIds.has(Number(productId));
    },
    [optimisticIds]
  );

  const toggleWishlist = async (rawProductId: number | string) => {
    const productId = Number(rawProductId);
    if (!isAuthenticated) {
      return;
    }
    if (isAdmin) {
      toast.info('Admins cannot add items to wishlist');
      return;
    }

    const currentlyWishlisted = optimisticIds.has(productId);

    // 1. Instant optimistic visual feedback
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      if (currentlyWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    if (currentlyWishlisted) {
      // Remove action
      const existing = wishlist?.items.find((i) => Number(i.productId) === productId);
      if (existing) {
        try {
          await wishlistApi.removeItem(existing.itemId);
          setWishlist((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((i) => i.itemId !== existing.itemId),
                  itemCount: Math.max(0, prev.itemCount - 1),
                }
              : null
          );
          toast.success('Removed from wishlist');
        } catch (err: any) {
          // Revert optimistic update
          setOptimisticIds((prev) => new Set([...prev, productId]));
          toast.error(err?.message || 'Failed to remove from wishlist');
        }
      } else {
        // If not found in memory, refresh from server
        try {
          await refreshWishlist();
          toast.success('Removed from wishlist');
        } catch {
          setOptimisticIds((prev) => new Set([...prev, productId]));
        }
      }
    } else {
      // Add action
      try {
        const updated = await wishlistApi.addItem(productId);
        if (updated) {
          setWishlist(updated);
        } else {
          await refreshWishlist();
        }
        toast.success('Added to wishlist');
      } catch (err: any) {
        // Revert optimistic update
        setOptimisticIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.error(err?.message || 'Failed to add to wishlist');
      }
    }
  };

  const removeItem = async (itemId: number) => {
    const target = wishlist?.items.find((i) => i.itemId === itemId);
    if (target) {
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(Number(target.productId));
        return next;
      });
    }

    try {
      await wishlistApi.removeItem(itemId);
      setWishlist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.itemId !== itemId),
              itemCount: Math.max(0, prev.itemCount - 1),
            }
          : null
      );
      toast.success('Item removed from wishlist');
    } catch (err: any) {
      if (target) {
        setOptimisticIds((prev) => new Set([...prev, Number(target.productId)]));
      }
      toast.error(err?.message || 'Failed to remove from wishlist');
      throw err;
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    try {
      await wishlistApi.moveToCart(item.itemId);
      setWishlist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.itemId !== item.itemId),
              itemCount: Math.max(0, prev.itemCount - 1),
            }
          : null
      );
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(Number(item.productId));
        return next;
      });
      await refreshCart();
      toast.success('Moved to cart');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to move to cart');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds: optimisticIds,
        loading,
        refreshWishlist,
        toggleWishlist,
        removeItem,
        moveToCart,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
