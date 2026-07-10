import { api } from './client';
import type {
  ApiResponse,
  Booking,
  BookingDetail,
  CheckoutPayload,
  CouponValidation,
  ReviewPayload,
} from '@/types';

export const bookingApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<Booking[]>>('/bookings', { params }),
  getById: (id: string) => api.get<ApiResponse<BookingDetail>>(`/bookings/${id}`),
  checkout: (data: CheckoutPayload) =>
    api.post<ApiResponse<{ orderGroupId: string; bookings: Booking[] }>>('/bookings/checkout', data),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  customerApproval: (
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    notes?: string,
  ) => api.put(`/bookings/${id}/customer-approval`, { decision, notes }),
  submitReview: (id: string, data: ReviewPayload) => api.post(`/bookings/${id}/review`, data),
};

export const couponApi = {
  validate: (data: {
    code: string;
    businessId: string;
    subtotal: number;
    serviceIds?: string[];
    cityName?: string;
    areaName?: string;
  }) => api.post<ApiResponse<CouponValidation>>('/coupons/validate', data),
};
