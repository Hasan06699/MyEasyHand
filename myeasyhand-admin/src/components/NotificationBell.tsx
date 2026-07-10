'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box, Button, Divider,
} from '@mui/material';
import { IconBell } from '@tabler/icons-react';
import { notificationApi, NotificationItem } from '@/lib/api';
import { getNotificationHref } from '@/lib/notification-routes';
import Link from 'next/link';

export default function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
    refetchInterval: 60000,
  });

  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: async () => {
      const res = await notificationApi.list(1);
      return res.data.data.slice(0, 8);
    },
    enabled: Boolean(anchorEl),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      refetch();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      refetch();
    },
  });

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [queryClient]);

  const handleClick = async (item: NotificationItem) => {
    setAnchorEl(null);
    if (!item.isRead) {
      await markReadMutation.mutateAsync(item._id);
    }
    router.push(getNotificationHref(item));
  };

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unread || 0} color="error" max={99}>
          <IconBell size={21} stroke={1.5} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={600}>Notifications</Typography>
          {(unread || 0) > 0 && (
            <Button size="small" onClick={() => markAllMutation.mutate()}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {!notifications?.length && (
          <MenuItem disabled><Typography variant="body2">No notifications</Typography></MenuItem>
        )}
        {notifications?.map((item) => (
          <MenuItem
            key={item._id}
            onClick={() => handleClick(item)}
            sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.5, bgcolor: item.isRead ? 'transparent' : 'action.hover' }}
          >
            <Box>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">{item.body}</Typography>
              <Typography variant="caption" color="text.disabled">
                {new Date(item.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem component={Link} href="/notifications" onClick={() => setAnchorEl(null)}>
          <Typography variant="body2" color="primary">View all notifications</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
