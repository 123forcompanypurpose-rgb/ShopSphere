import { axiosClient } from './axiosClient';
import { Payment } from './types';

export const paymentsApi = {
  getPaymentByOrderId: async (orderId: number): Promise<Payment> => {
    const res = await axiosClient.get<Payment>(`/api/payments/order/${orderId}`);
    return res.data;
  },
};
