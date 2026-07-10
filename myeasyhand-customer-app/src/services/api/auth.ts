import { api } from './client';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', {
      email,
      password,
    }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) =>
    api.post<
      ApiResponse<{
        user: User;
        requiresOtp: boolean;
        accessToken?: string;
        refreshToken?: string;
      }>
    >('/auth/register', data),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  updateMe: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>) =>
    api.put<ApiResponse<User>>('/auth/me', data),
  logout: () => api.post('/auth/logout'),
  verifyOtp: (userId: string, code: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/verify-otp', {
      userId,
      code,
    }),
  resendOtp: (userId: string) => api.post('/auth/resend-otp', { userId }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  googleLogin: (idToken: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/google', {
      idToken,
    }),
  registerDevice: (data: {
    platform: 'android' | 'ios';
    onesignalSubscriptionId?: string;
    deviceLabel?: string;
  }) => api.post('/auth/devices/register', data),
};
