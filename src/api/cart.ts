import { axiosClient } from './axiosClient';
import { Cart } from './types';

export interface AddCartItemDto {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await axiosClient.get<Cart>('/api/cart');
    return res.data;
  },

  addItem: async (dto: AddCartItemDto): Promise<Cart> => {
    const res = await axiosClient.post<Cart>('/api/cart/items', dto);
    return res.data;
  },

  updateItem: async (itemId: number, dto: UpdateCartItemDto): Promise<Cart> => {
    const res = await axiosClient.put<Cart>(`/api/cart/items/${itemId}`, dto);
    return res.data;
  },

  removeItem: async (itemId: number): Promise<void> => {
    await axiosClient.delete(`/api/cart/items/${itemId}`);
  },

  clearCart: async (): Promise<void> => {
    await axiosClient.delete('/api/cart');
  },
};
