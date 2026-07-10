import { api } from './client';
import type { ApiResponse, CouponSummary, CouponValidation, PromotionBanner, ServiceRow } from '@/types';

export const promotionApi = {
  activeBanners: (params?: {
    platform?: string;
    location?: string;
    businessId?: string;
    city?: string;
  }) => api.get<ApiResponse<PromotionBanner[]>>('/promotions/banners/active', { params }),
  activeBannerById: (id: string, params?: { platform?: string; businessId?: string; city?: string }) =>
    api.get<ApiResponse<PromotionBanner>>(`/promotions/banners/active/${id}`, { params }),
  activeServiceRows: (params?: {
    platform?: string;
    location?: string;
    businessId?: string;
    city?: string;
  }) => api.get<ApiResponse<ServiceRow[]>>('/promotions/service-rows/active', { params }),
  track: (data: {
    entityType: 'banner' | 'service_row';
    entityId: string;
    eventType: 'view' | 'click' | 'coupon_use' | 'booking_conversion';
    businessId?: string;
    couponId?: string;
    bookingId?: string;
    revenue?: number;
  }) => api.post('/promotions/track', data),
};

export const couponApi = {
  available: (businessId?: string) =>
    api.get<ApiResponse<CouponSummary[]>>('/coupons/available', { params: { businessId } }),
  validate: (data: {
    code: string;
    businessId: string;
    subtotal: number;
    serviceIds?: string[];
    categoryIds?: string[];
    cityName?: string;
    areaName?: string;
  }) => api.post<ApiResponse<CouponValidation>>('/coupons/validate', data),
};
