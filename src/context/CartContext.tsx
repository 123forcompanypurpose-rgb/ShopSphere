import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Cart, CartItem } from '../api/types';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCustomer } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isCustomer) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // Don't toast on initial passive load errors
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (isCustomer) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isCustomer, refreshCart]);

  const addItem = async (productId: number, quantity = 1) => {
    try {
      const updatedCart = await cartApi.addItem({ productId, quantity });
      setCart(updatedCart);
      toast.success('Added to cart');
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (
        msg.includes('out of stock') ||
        msg.includes('only 0 units') ||
        err?.status === 409 ||
        (err?.status === 400 && msg.includes('stock'))
      ) {
        toast.error('This product is currently out of stock.');
      } else {
        toast.error(err?.message || 'Failed to add item to cart');
      }
      throw err;
    }
  };

  const updateItemQuantity = async (itemId: number, quantity: number) => {
    if (!cart) return;

    // Optimistic update
    const previousItems = [...cart.items];
    const targetItem = cart.items.find((i) => i.itemId === itemId);
    if (!targetItem) return;

    const optimisticItems: CartItem[] = cart.items.map((item) =>
      item.itemId === itemId
        ? {
            ...item,
            quantity,
            lineTotal: Number((item.unitPrice * quantity).toFixed(2)),
          }
        : item
    );

    const optimisticSubtotal = optimisticItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const optimisticItemCount = optimisticItems.reduce((acc, curr) => acc + curr.quantity, 0);

    setCart({
      ...cart,
      items: optimisticItems,
      subtotal: optimisticSubtotal,
      itemCount: optimisticItemCount,
    });

    try {
      const updatedCart = await cartApi.updateItem(itemId, { quantity });
      setCart(updatedCart);
    } catch (err: any) {
      // Rollback on failure
      setCart({
        ...cart,
        items: previousItems,
      });
      toast.error(err?.message || 'Failed to update item quantity');
      throw err;
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      await refreshCart();
      toast.success('Item removed from cart');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove item');
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart({
        cartId: cart?.cartId || 0,
        items: [],
        itemCount: 0,
        subtotal: 0,
      });
      toast.success('Cart cleared');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to clear cart');
      throw err;
    }
  };

  const itemCount = cart?.itemCount ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        loading,
        refreshCart,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
