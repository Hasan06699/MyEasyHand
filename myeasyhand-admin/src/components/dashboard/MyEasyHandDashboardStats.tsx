'use client';

import { Grid, Typography, Box, Skeleton, Stack } from '@mui/material';
import { formatCurrency } from '@/lib/format';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';

export default function MyEasyHandDashboardStats() {
  const {
    user,
    isSuperAdmin,
    isBusinessOwner,
    canViewMarketing,
    bookingStats,
    customerStats,
    promotionStats,
    earnings,
    isLoading,
    isEarningsLoading,
  } = useDashboardData();

  const pendingActions =
    (bookingStats?.pendingBookings ?? 0) + (bookingStats?.awaitingApproval ?? 0);

  const heroCards = isBusinessOwner && !isSuperAdmin
    ? [
        {
          label: 'Total Earnings',
          value: formatCurrency(earnings?.totalEarnings ?? 0),
          icon: 'solar:wallet-money-linear',
          color: '#2cd07e',
          subtitle: `${earnings?.pendingBookingsCount ?? 0} pending bookings`,
        },
        {
          label: 'Revenue Collected',
          value: formatCurrency(bookingStats?.revenue ?? 0),
          icon: 'solar:chart-2-linear',
          color: '#1B84FF',
          subtitle: 'From paid bookings',
        },
        {
          label: 'Total Bookings',
          value: bookingStats?.totalBookings ?? 0,
          icon: 'solar:calendar-linear',
          color: '#725AF2',
          subtitle: `${bookingStats?.completedBookings ?? 0} completed`,
        },
        {
          label: 'Needs Action',
          value: pendingActions,
          icon: 'solar:bell-bing-linear',
          color: '#F6C000',
          subtitle: 'Pending & awaiting approval',
        },
      ]
    : [
        {
          label: 'Revenue Collected',
          value: formatCurrency(bookingStats?.revenue ?? 0),
          icon: 'solar:chart-2-linear',
          color: '#1B84FF',
          subtitle: 'Platform-wide paid revenue',
        },
        {
          label: 'Total Bookings',
          value: bookingStats?.totalBookings ?? 0,
          icon: 'solar:calendar-linear',
          color: '#725AF2',
          subtitle: `${bookingStats?.completedBookings ?? 0} completed`,
        },
        {
          label: 'Active Customers',
          value: customerStats?.active ?? 0,
          icon: 'solar:users-group-rounded-linear',
          color: '#43CED7',
          subtitle: `${customerStats?.total ?? 0} total customers`,
        },
        {
          label: 'Needs Action',
          value: pendingActions,
          icon: 'solar:bell-bing-linear',
          color: '#F6C000',
          subtitle: 'Pending & awaiting approval',
        },
      ];

  const secondaryCards = canViewMarketing
    ? [
        {
          label: 'Promotion Clicks',
          value: promotionStats?.totalClicks ?? 0,
          icon: 'solar:cursor-square-linear',
          color: '#43CED7',
          subtitle: `${promotionStats?.clickThroughRate ?? 0}% CTR`,
        },
        {
          label: 'Conversions',
          value: promotionStats?.bookingConversions ?? 0,
          icon: 'solar:star-fall-minimalistic-2-linear',
          color: '#2cd07e',
          subtitle: formatCurrency(promotionStats?.revenueGenerated ?? 0),
        },
        {
          label: 'Active Banners',
          value: promotionStats?.activeBanners ?? 0,
          icon: 'solar:gallery-wide-linear',
          color: '#725AF2',
          subtitle: `${promotionStats?.activeServiceRows ?? 0} service rows`,
        },
        {
          label: 'Awaiting Approval',
          value: bookingStats?.awaitingApproval ?? 0,
          icon: 'solar:check-circle-linear',
          color: '#F8285A',
          subtitle: `${bookingStats?.pendingBookings ?? 0} pending bookings`,
        },
      ]
    : [
        {
          label: 'Completed',
          value: bookingStats?.completedBookings ?? 0,
          icon: 'solar:check-circle-linear',
          color: '#2cd07e',
          subtitle: 'Successfully finished',
        },
        {
          label: 'Pending',
          value: bookingStats?.pendingBookings ?? 0,
          icon: 'solar:clock-circle-linear',
          color: '#F6C000',
          subtitle: 'Awaiting confirmation',
        },
        {
          label: 'Awaiting Approval',
          value: bookingStats?.awaitingApproval ?? 0,
          icon: 'solar:hourglass-linear',
          color: '#725AF2',
          subtitle: 'Customer sign-off needed',
        },
        {
          label: 'Revenue',
          value: formatCurrency(bookingStats?.revenue ?? 0),
          icon: 'solar:wallet-money-linear',
          color: '#1B84FF',
          subtitle: 'Collected payments',
        },
      ];

  const displayName = user?.firstName ? `${user.firstName}` : 'there';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3, gap: 1 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Welcome back, {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuperAdmin ? 'Platform overview' : 'Business performance snapshot'} · {today}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {(isLoading || isEarningsLoading
          ? Array.from({ length: 4 })
          : heroCards
        ).map((card, index) => (
          <Grid key={card?.label ?? index} size={{ xs: 12, sm: 6, lg: 3 }}>
            {isLoading || isEarningsLoading ? (
              <Skeleton variant="rounded" height={118} />
            ) : (
              <DashboardStatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {(isLoading
          ? Array.from({ length: 4 })
          : secondaryCards
        ).map((card, index) => (
          <Grid key={card?.label ?? index} size={{ xs: 12, sm: 6, lg: 3 }}>
            {isLoading ? (
              <Skeleton variant="rounded" height={118} />
            ) : (
              <DashboardStatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
