import { axiosClient } from './axiosClient';
import { Category } from './types';

export interface SaveCategoryDto {
  name: string;
  description?: string;
}

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await axiosClient.get<Category[] | { content: Category[] }>('/api/categories');
    // Handle both plain array and Spring-Page-style { content: [...] } responses
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).content)) return (data as any).content;
    return [];
  },

  createCategory: async (dto: SaveCategoryDto): Promise<Category> => {
    const res = await axiosClient.post<Category>('/api/categories', dto);
    return res.data;
  },

  updateCategory: async (id: number, dto: SaveCategoryDto): Promise<Category> => {
    const res = await axiosClient.put<Category>(`/api/categories/${id}`, dto);
    return res.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/categories/${id}`);
  },
};
