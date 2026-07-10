'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { formatDate } from '@/lib/utils';
import { getNotificationHref, getNotificationMessage } from '@/lib/notification-routes';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  useProtectedRoute();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list({ limit: 50 });
      return res.data.data;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const handleClick = async (notification: (typeof notifications)[number]) => {
    if (!notification.isRead) {
      await markReadMutation.mutateAsync(notification._id);
    }
    router.push(getNotificationHref(notification));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading && <p className="mt-8 text-slate-500">Loading...</p>}

      {!isLoading && notifications.length === 0 && (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="No notifications" className="mt-8" />
      )}

      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <button
            key={n._id}
            type="button"
            onClick={() => handleClick(n)}
            className={`w-full rounded-xl border p-4 text-left transition-colors hover:border-blue-300 hover:shadow-sm ${
              n.isRead ? 'bg-white' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{getNotificationMessage(n)}</p>
              </div>
              <p className="shrink-0 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
