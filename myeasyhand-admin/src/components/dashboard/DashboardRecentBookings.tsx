'use client';

import Link from 'next/link';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  Skeleton,
  Box,
  Avatar,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { BookingItem } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'> = {
  pending: 'warning',
  accepted: 'info',
  awaiting_customer_approval: 'warning',
  completed: 'success',
  paid: 'success',
  cancelled: 'error',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function customerName(booking: BookingItem) {
  if (!booking.customerId) return '—';
  return `${booking.customerId.firstName} ${booking.customerId.lastName}`;
}

function customerInitials(booking: BookingItem) {
  if (!booking.customerId) return '?';
  return `${booking.customerId.firstName[0] ?? ''}${booking.customerId.lastName[0] ?? ''}`.toUpperCase();
}

function BookingTable({
  title,
  bookings,
  emptyMessage,
  highlight,
}: {
  title: string;
  bookings: BookingItem[];
  emptyMessage: string;
  highlight?: boolean;
}) {
  return (
    <DashboardCard
      title={title}
      action={
        <Button component={Link} href="/bookings" size="small" variant="text">
          View all
        </Button>
      }
    >
      {bookings.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Icon icon="solar:calendar-minimalistic-linear" width={40} style={{ opacity: 0.35 }} />
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: highlight ? 'warning.light' : 'grey.100' }}>
                <TableCell>Booking</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id} hover>
                  <TableCell>
                    <Typography
                      component={Link}
                      href={`/bookings?bookingId=${booking._id}`}
                      variant="body2"
                      sx={{ fontWeight: 600, textDecoration: 'none', color: 'primary.main' }}
                    >
                      {booking.bookingNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                        {customerInitials(booking)}
                      </Avatar>
                      <Typography variant="body2">{customerName(booking)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{booking.serviceId?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(booking.status)}
                      size="small"
                      color={STATUS_COLORS[booking.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(booking.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </DashboardCard>
  );
}

export default function DashboardRecentBookings() {
  const { recentBookings, pendingBookings, approvalBookings, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  const actionBookings = [
    ...(approvalBookings ?? []).slice(0, 5),
    ...(pendingBookings ?? [])
      .filter((booking) => booking.status === 'pending')
      .slice(0, 5),
  ].slice(0, 5);

  return (
    <Stack spacing={3}>
      {actionBookings.length > 0 && (
        <BookingTable
          title="Needs Attention"
          bookings={actionBookings}
          emptyMessage="No bookings need attention"
          highlight
        />
      )}
      <BookingTable
        title="Recent Bookings"
        bookings={recentBookings.slice(0, 8)}
        emptyMessage="No bookings yet"
      />
    </Stack>
  );
}
