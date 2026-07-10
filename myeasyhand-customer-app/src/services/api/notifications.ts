import { api } from './client';
import type { ApiResponse, Notification } from '@/types';

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }),
  unreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
