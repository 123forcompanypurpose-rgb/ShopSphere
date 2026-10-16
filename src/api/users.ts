import { axiosClient } from './axiosClient';
import { User, Address, CreateAddressDto } from './types';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  phone: string;
}

export const usersApi = {
  register: async (dto: RegisterDto): Promise<RegisterResponse> => {
    const res = await axiosClient.post<RegisterResponse>('/api/users/register', dto);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await axiosClient.get<User>('/api/users/me');
    return res.data;
  },

  updateMe: async (dto: UpdateUserDto): Promise<User> => {
    // Only firstName, lastName, phone per spec §7
    const res = await axiosClient.put<User>('/api/users/me', dto);
    return res.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const res = await axiosClient.get<Address[]>('/api/users/me/addresses');
    return res.data;
  },

  addAddress: async (dto: CreateAddressDto): Promise<Address> => {
    // Never send isDefault per spec §7
    const res = await axiosClient.post<Address>('/api/users/me/addresses', dto);
    return res.data;
  },

  updateAddress: async (addressId: number, dto: CreateAddressDto): Promise<Address> => {
    // Never send isDefault per spec §7
    const res = await axiosClient.put<Address>(`/api/users/me/addresses/${addressId}`, dto);
    return res.data;
  },

  deleteAddress: async (addressId: number): Promise<void> => {
    await axiosClient.delete(`/api/users/me/addresses/${addressId}`);
  },

  setDefaultAddress: async (addressId: number): Promise<Address> => {
    const res = await axiosClient.patch<Address>(`/api/users/me/addresses/${addressId}/default`);
    return res.data;
  },
};
