'use client';

import { Box, Stack } from '@mui/material';
import MyEasyHandDashboardStats from '@/components/dashboard/MyEasyHandDashboardStats';
import DashboardBookingCharts from '@/components/dashboard/DashboardBookingCharts';
import DashboardAudienceCharts from '@/components/dashboard/DashboardAudienceCharts';
import DashboardRecentBookings from '@/components/dashboard/DashboardRecentBookings';
import DashboardPromotionInsights from '@/components/dashboard/DashboardPromotionInsights';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const {
    canViewAudience,
    canViewMarketing,
    bookingStats,
    recentBookings,
    customerStats,
    employeeStats,
    couponStats,
    isLoading,
    isAudienceLoading,
  } = useDashboardData();

  return (
    <Box>
      <MyEasyHandDashboardStats />

      <Stack spacing={3}>
        <DashboardBookingCharts
          totalBookings={bookingStats?.totalBookings ?? 0}
          pendingBookings={bookingStats?.pendingBookings ?? 0}
          completedBookings={bookingStats?.completedBookings ?? 0}
          awaitingApproval={bookingStats?.awaitingApproval ?? 0}
          revenue={bookingStats?.revenue ?? 0}
          recentBookings={recentBookings}
          loading={isLoading}
        />

        {canViewAudience && (
          <DashboardAudienceCharts
            customerStats={customerStats}
            employeeStats={employeeStats}
            couponStats={couponStats}
            loading={isAudienceLoading}
          />
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: canViewMarketing ? '1.2fr 0.8fr' : '1fr' },
            gap: 3,
          }}
        >
          <DashboardRecentBookings />
          {canViewMarketing && <DashboardPromotionInsights />}
        </Box>
      </Stack>
    </Box>
  );
};

export default Dashboard;
