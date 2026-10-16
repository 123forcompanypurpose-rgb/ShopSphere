import { axiosClient } from './axiosClient';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  role: 'CUSTOMER' | 'ADMIN';
  expiresIn: number; // in seconds
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await axiosClient.post<LoginResponse>('/api/auth/login', dto);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosClient.post('/api/auth/logout');
    } catch {
      // Ignore logout errors per spec §5.4
    }
  },

  changePassword: async (dto: ChangePasswordDto): Promise<void> => {
    await axiosClient.post('/api/auth/change-password', dto);
  },
};
