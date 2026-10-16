import { axiosClient } from './axiosClient';
import { Review, ReviewSummary } from './types';

export interface CreateReviewDto {
  productId: number;
  rating: number; // 1-5
  comment?: string; // <= 1000
}

export interface UpdateReviewDto {
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  getProductReviews: async (productId: number): Promise<ReviewSummary> => {
    const res = await axiosClient.get<ReviewSummary>(`/api/reviews/product/${productId}`);
    return res.data;
  },

  getProductReviewSummary: async (productId: number): Promise<ReviewSummary> => {
    const res = await axiosClient.get<ReviewSummary>(`/api/reviews/product/${productId}/summary`);
    return res.data;
  },

  createReview: async (dto: CreateReviewDto): Promise<Review> => {
    const res = await axiosClient.post<Review>('/api/reviews', dto);
    return res.data;
  },

  updateReview: async (reviewId: number, dto: UpdateReviewDto): Promise<Review> => {
    const res = await axiosClient.put<Review>(`/api/reviews/${reviewId}`, dto);
    return res.data;
  },

  deleteReview: async (reviewId: number): Promise<void> => {
    await axiosClient.delete(`/api/reviews/${reviewId}`);
  },

  getMyReviews: async (): Promise<Review[]> => {
    const res = await axiosClient.get<Review[]>('/api/reviews/me');
    return res.data;
  },
};
