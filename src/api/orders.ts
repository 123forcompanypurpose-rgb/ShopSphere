import { axiosClient } from './axiosClient';
import { Order, OrderStatus, PageResponse } from './types';

export interface CreateOrderDto {
  addressId: number;
  paymentMethod: 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH_ON_DELIVERY';
}

export const ordersApi = {
  createOrder: async (dto: CreateOrderDto): Promise<Order> => {
    const res = await axiosClient.post<Order>('/api/orders', dto);
    return res.data;
  },

  getOrders: async (page = 0, size = 10): Promise<PageResponse<Order>> => {
    const res = await axiosClient.get<PageResponse<Order>>('/api/orders', {
      params: { page, size },
    });
    return res.data;
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    const res = await axiosClient.get<Order>(`/api/orders/${orderId}`);
    return res.data;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const res = await axiosClient.patch<Order>(`/api/orders/${orderId}/cancel`);
    return res.data;
  },

  getAdminOrders: async (page = 0, size = 10): Promise<PageResponse<Order>> => {
    const res = await axiosClient.get<PageResponse<Order>>('/api/orders/admin/all', {
      params: { page, size },
    });
    return res.data;
  },

  updateAdminOrderStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
    const res = await axiosClient.patch<Order>(`/api/orders/admin/${orderId}/status`, { status });
    return res.data;
  },
};
