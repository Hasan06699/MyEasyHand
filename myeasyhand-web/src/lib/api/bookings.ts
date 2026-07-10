import { api } from './client';
import type {
  ApiResponse,
  Booking,
  BookingDetail,
  CheckoutPayload,
  ReviewPayload,
} from '@/types';

export const bookingApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<Booking[]>>('/bookings', { params }),
  getById: (id: string) => api.get<ApiResponse<BookingDetail>>(`/bookings/${id}`),
  create: (data: { serviceId: string; businessId: string; scheduledAt: string; notes?: string }) =>
    api.post<ApiResponse<Booking>>('/bookings', data),
  checkout: (data: CheckoutPayload) =>
    api.post<ApiResponse<{ orderGroupId: string; bookings: Booking[] }>>('/bookings/checkout', data),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  customerApproval: (
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    notes?: string,
  ) => api.put(`/bookings/${id}/customer-approval`, { decision, notes }),
  submitReview: (id: string, data: ReviewPayload) =>
    api.post(`/bookings/${id}/review`, data),
};
