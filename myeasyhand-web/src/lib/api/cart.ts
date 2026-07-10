import { api } from './client';
import type { ApiResponse, CartItem, Service } from '@/types';

export interface ServerCartResponse {
  items: CartItem[];
  scheduledAt: string;
  notes: string;
  couponCode: string;
  cityName: string;
  areaName: string;
  updatedAt: string | null;
}

export interface SaveCartPayload {
  items: Array<{ serviceId: string; quantity: number; notes?: string }>;
  scheduledAt?: string;
  notes?: string;
  couponCode?: string;
  cityName?: string;
  areaName?: string;
  clientUpdatedAt?: string;
}

export const cartApi = {
  get: () => api.get<ApiResponse<ServerCartResponse>>('/cart'),
  save: (data: SaveCartPayload) => api.put<ApiResponse<ServerCartResponse>>('/cart', data),
  clear: () => api.delete<ApiResponse<{ message: string }>>('/cart'),
};

export type { Service };
