'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Chip, Button, Dialog, DialogTitle, DialogContent, TextField, Stack, MenuItem, Alert, Tabs, Tab,
} from '@mui/material';
import { notificationApi, businessApi, NotificationItem } from '@/lib/api';
import { getNotificationHref } from '@/lib/notification-routes';
import { useAuthStore } from '@/stores/auth.store';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const emptySendForm = {
  title: '',
  body: '',
  roleSlug: 'business_owner',
  businessId: '',
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');
  const [tab, setTab] = useState(0);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState(emptySendForm);
  const [error, setError] = useState('');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-page', isSuperAdmin],
    queryFn: async () => {
      const res = isSuperAdmin ? await notificationApi.listAdmin() : await notificationApi.list();
      return res.data.data;
    },
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await businessApi.list();
      return res.data.data as Array<{ _id: string; name: string; email: string }>;
    },
    enabled: isSuperAdmin,
  });

  const sendMutation = useMutation({
    mutationFn: () => notificationApi.send({
      title: sendForm.title,
      body: sendForm.body,
      type: 'admin_message',
      roleSlug: sendForm.businessId ? undefined : sendForm.roleSlug,
      businessId: sendForm.businessId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      setSendOpen(false);
      setSendForm(emptySendForm);
      setError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send';
      setError(message);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const handleRowClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markReadMutation.mutateAsync(item._id);
    }
    router.push(getNotificationHref(item));
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Notifications</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => markAllMutation.mutate()}>Mark all read</Button>
          {isSuperAdmin && (
            <Button variant="contained" onClick={() => { setSendOpen(true); setError(''); }}>
              Send Notification
            </Button>
          )}
        </Stack>
      </Stack>

      {isSuperAdmin && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="All Notifications" />
          <Tab label="Send" />
        </Tabs>
      )}

      {(tab === 0 || !isSuperAdmin) && (
        <DashboardCard title={isSuperAdmin ? 'All Platform Notifications' : 'My Notifications'}>
          {isLoading && <Typography>Loading...</Typography>}
          {notifications && (
            <Paper variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    {isSuperAdmin && <TableCell>Recipient</TableCell>}
                    <TableCell>Title</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 6 : 5} align="center">No notifications</TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((item: NotificationItem) => (
                      <TableRow
                        key={item._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(item)}
                      >
                        {isSuperAdmin && (
                          <TableCell>
                            {item.userId
                              ? `${item.userId.firstName} ${item.userId.lastName}`
                              : '—'}
                          </TableCell>
                        )}
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.body}</TableCell>
                        <TableCell><Chip label={item.type} size="small" /></TableCell>
                        <TableCell>
                          <Chip label={item.isRead ? 'Read' : 'Unread'} size="small" color={item.isRead ? 'default' : 'primary'} />
                        </TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </DashboardCard>
      )}

      {isSuperAdmin && tab === 1 && (
        <DashboardCard title="Send Push & In-App Notification">
          <Stack spacing={2} maxWidth={480}>
            <Alert severity="info">
              Notifications are saved in the database and sent via OneSignal push (when configured).
            </Alert>
            <TextField label="Title" value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} fullWidth />
            <TextField label="Message" value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} fullWidth multiline rows={3} />
            <TextField select label="Send to role" value={sendForm.roleSlug} onChange={(e) => setSendForm({ ...sendForm, roleSlug: e.target.value, businessId: '' })} fullWidth disabled={!!sendForm.businessId}>
              <MenuItem value="business_owner">All Business Owners</MenuItem>
              <MenuItem value="employee">All Employees</MenuItem>
              <MenuItem value="customer">All Customers</MenuItem>
              <MenuItem value="super_admin">All Admins</MenuItem>
            </TextField>
            <TextField select label="Or specific business owner" value={sendForm.businessId} onChange={(e) => setSendForm({ ...sendForm, businessId: e.target.value })} fullWidth>
              <MenuItem value="">— Broadcast by role —</MenuItem>
              {businesses?.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.name} ({b.email})</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !sendForm.title || !sendForm.body}>
              {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
            </Button>
          </Stack>
        </DashboardCard>
      )}

      <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Title" value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} fullWidth />
            <TextField label="Message" value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} fullWidth multiline rows={3} />
            <TextField select label="Send to role" value={sendForm.roleSlug} onChange={(e) => setSendForm({ ...sendForm, roleSlug: e.target.value, businessId: '' })} fullWidth disabled={!!sendForm.businessId}>
              <MenuItem value="business_owner">All Business Owners</MenuItem>
              <MenuItem value="employee">All Employees</MenuItem>
              <MenuItem value="customer">All Customers</MenuItem>
            </TextField>
            <TextField select label="Or specific business" value={sendForm.businessId} onChange={(e) => setSendForm({ ...sendForm, businessId: e.target.value })} fullWidth>
              <MenuItem value="">— By role —</MenuItem>
              {businesses?.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !sendForm.title || !sendForm.body}>
              Send
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
