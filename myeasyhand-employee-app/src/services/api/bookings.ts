import { api } from './client';
import type { ApiResponse, Booking, BookingDetail, PaymentMethod } from '@/types';

export const bookingApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<Booking[]>>('/bookings', { params }),
  getById: (id: string) => api.get<ApiResponse<BookingDetail>>(`/bookings/${id}`),
  respondToAssignment: (
    id: string,
    assignmentId: string,
    response: 'accepted' | 'rejected',
    notes?: string,
  ) => api.put(`/bookings/${id}/assignments/${assignmentId}/respond`, { response, notes }),
  scheduleVisit: (id: string, visitScheduledAt: string, notes?: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}/visit-schedule`, { visitScheduledAt, notes }),
  verifyVisit: (id: string, data: { otp?: string; qrToken?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/verify-visit`, data),
  checkIn: (id: string, data?: { latitude?: number; longitude?: number; notes?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/check-in`, data ?? {}),
  checkOut: (id: string, data?: { latitude?: number; longitude?: number; notes?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/check-out`, data ?? {}),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}/status`, { status, notes }),
  requestApproval: (id: string, notes?: string) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/request-approval`, { notes }),
  complete: (id: string, data?: { completionNotes?: string }) =>
    api.post<ApiResponse<Booking>>(`/bookings/${id}/complete`, data ?? {}),
  recordPayment: (
    id: string,
    data: { amount: number; method: PaymentMethod; transactionRef?: string; notes?: string },
  ) => api.post(`/bookings/${id}/payment`, data),
  addMaterial: (
    id: string,
    data: { name: string; quantity: number; unitPrice: number; notes?: string },
  ) => api.post(`/bookings/${id}/materials`, data),
};
