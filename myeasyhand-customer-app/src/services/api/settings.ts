import { api } from './client';
import type { ApiResponse } from '@/types';

export interface PublicAuthSettings {
  otpVerificationEnabled: boolean;
  googleLoginEnabled: boolean;
  googleClientId?: string;
}

export const settingsApi = {
  getPublic: () => api.get<ApiResponse<PublicAuthSettings>>('/platform-settings/public'),
};
