import { api } from './client';
import type { ApiResponse, EmployeeProfile, AvailabilitySlot } from '@/types';

export const employeeApi = {
  me: () => api.get<ApiResponse<EmployeeProfile>>('/employees/me'),
  updateAvailability: (id: string, availability: Omit<AvailabilitySlot, '_id'>[]) =>
    api.put<ApiResponse<AvailabilitySlot[]>>(`/employees/${id}/availability`, { availability }),
};
