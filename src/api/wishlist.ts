import { axiosClient } from './axiosClient';
import { Wishlist, ApiError } from './types';

export const wishlistApi = {
  getWishlist: async (): Promise<Wishlist> => {
    const res = await axiosClient.get<Wishlist>('/api/wishlist');
    return res.data;
  },

  addItem: async (productId: number): Promise<Wishlist> => {
    try {
      const res = await axiosClient.post<Wishlist>('/api/wishlist/items', { productId });
      return res.data;
    } catch (err: unknown) {
      // 409 if already present: return current wishlist per spec §7
      if ((err as ApiError)?.status === 409) {
        return await wishlistApi.getWishlist();
      }
      throw err;
    }
  },

  removeItem: async (itemId: number): Promise<void> => {
    await axiosClient.delete(`/api/wishlist/items/${itemId}`);
  },

  moveToCart: async (itemId: number): Promise<void> => {
    await axiosClient.post(`/api/wishlist/items/${itemId}/move-to-cart`);
  },
};
