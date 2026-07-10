import { api } from './client';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', {
      email,
      password,
    }),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  updateMe: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>) =>
    api.put<ApiResponse<User>>('/auth/me', data),
  logout: () => api.post('/auth/logout'),
  registerDevice: (data: {
    platform: 'android' | 'ios';
    onesignalSubscriptionId?: string;
    deviceLabel?: string;
  }) => api.post('/auth/devices/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};
