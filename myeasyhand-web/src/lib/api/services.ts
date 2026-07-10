import { api } from './client';
import type {
  ApiResponse,
  Service,
  ServiceCategory,
  ServiceFilters,
} from '@/types';

export const serviceApi = {
  list: (filters?: ServiceFilters) =>
    api.get<ApiResponse<Service[]>>('/services', {
      params: {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 20,
        businessId: filters?.businessId,
        status: filters?.status,
        featured: filters?.featured ? 'true' : undefined,
        popular: filters?.popular ? 'true' : undefined,
        parentCategoryId: filters?.parentCategoryId,
        subCategoryId: filters?.subCategoryId,
        categoryId: filters?.categoryId,
      },
    }),
  getById: (id: string) => api.get<ApiResponse<Service>>(`/services/${id}`),
  categories: (tree = true) =>
    api.get<ApiResponse<ServiceCategory[]>>('/services/categories', {
      params: { tree: tree ? 'true' : undefined },
    }),
  getCategory: (id: string) => api.get<ApiResponse<ServiceCategory>>(`/services/categories/${id}`),
};
