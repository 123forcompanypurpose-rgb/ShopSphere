import { axiosClient } from './axiosClient';
import { Product, PageResponse } from './types';

export interface ProductQueryParams {
  keyword?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'newest' | 'priceAsc' | 'priceDesc';
  page?: number; // 0-based
  size?: number; // default 12
}

export interface SaveProductDto {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl?: string;
}

export const productsApi = {
  getProducts: async (params?: ProductQueryParams): Promise<PageResponse<Product>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params) {
      if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
      if (params.categoryId !== undefined) cleanParams.categoryId = params.categoryId;
      if (params.minPrice !== undefined && params.minPrice > 0) cleanParams.minPrice = params.minPrice;
      if (params.maxPrice !== undefined && params.maxPrice > 0) cleanParams.maxPrice = params.maxPrice;
      if (params.inStock !== undefined) cleanParams.inStock = params.inStock;
      if (params.sort) cleanParams.sort = params.sort;
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
    }

    const res = await axiosClient.get<PageResponse<Product>>('/api/products', {
      params: cleanParams,
    });
    return res.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await axiosClient.get<Product>(`/api/products/${id}`);
    return res.data;
  },

  createProduct: async (dto: SaveProductDto): Promise<Product> => {
    const res = await axiosClient.post<Product>('/api/products', dto);
    return res.data;
  },

  updateProduct: async (id: number, dto: SaveProductDto): Promise<Product> => {
    const res = await axiosClient.put<Product>(`/api/products/${id}`, dto);
    return res.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/products/${id}`);
  },
};
