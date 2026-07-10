import { api } from './client';
import type { ApiResponse, PromotionBanner, ServiceRow } from '@/types';

export const promotionApi = {
  activeBanners: (params?: { platform?: string; location?: string }) =>
    api.get<ApiResponse<PromotionBanner[]>>('/promotions/banners/active', {
      params: { ...params, platform: params?.platform ?? 'mobile_app' },
    }),
  activeBannerById: (id: string, params?: { platform?: string }) =>
    api.get<ApiResponse<PromotionBanner>>(`/promotions/banners/active/${id}`, {
      params: { ...params, platform: params?.platform ?? 'mobile_app' },
    }),
  activeServiceRows: (params?: { platform?: string; location?: string }) =>
    api.get<ApiResponse<ServiceRow[]>>('/promotions/service-rows/active', {
      params: { ...params, platform: params?.platform ?? 'mobile_app' },
    }),
};
