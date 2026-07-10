import { api } from './client';
import type { ApiResponse, Business } from '@/types';

export const businessApi = {
  listPublic: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Business[]>>('/businesses/public', { params }),
  getBySlug: (slug: string) => api.get<ApiResponse<Business>>(`/businesses/public/${slug}`),
};
