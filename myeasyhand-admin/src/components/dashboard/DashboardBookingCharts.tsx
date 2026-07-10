'use client';

import dynamic from 'next/dynamic';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { BookingItem } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

function buildWeeklyTrend(bookings: BookingItem[]) {
  const days: Array<{ label: string; key: string; count: number; revenue: number }> = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push({
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      key: date.toISOString().slice(0, 10),
      count: 0,
      revenue: 0,
    });
  }

  const dayMap = Object.fromEntries(days.map((day) => [day.key, day]));

  for (const booking of bookings) {
    const key = new Date(booking.scheduledAt).toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].count += 1;
      dayMap[key].revenue += booking.totalAmount;
    }
  }

  return days;
}

type BookingChartsProps = {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  awaitingApproval: number;
  revenue: number;
  recentBookings: BookingItem[];
  loading?: boolean;
};

export default function DashboardBookingCharts({
  totalBookings,
  pendingBookings,
  completedBookings,
  awaitingApproval,
  revenue,
  recentBookings,
  loading,
}: BookingChartsProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const warning = theme.palette.warning.main;
  const success = theme.palette.success.main;
  const info = theme.palette.info.main;
  const secondary = theme.palette.secondary.main;

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Skeleton variant="rounded" height={340} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Skeleton variant="rounded" height={340} />
        </Grid>
      </Grid>
    );
  }

  const otherBookings = Math.max(
    totalBookings - pendingBookings - completedBookings - awaitingApproval,
    0,
  );

  const statusSeries = [completedBookings, pendingBookings, awaitingApproval, otherBookings];
  const statusLabels = ['Completed', 'Pending', 'Awaiting Approval', 'In Progress'];
  const statusColors = [success, warning, info, secondary];

  const weeklyTrend = buildWeeklyTrend(recentBookings);

  const donutOptions: Record<string, unknown> = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: statusLabels,
    colors: statusColors,
    legend: { position: 'bottom', fontSize: '13px' },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', color: theme.palette.text.secondary },
            value: { show: true, fontSize: '22px', fontWeight: 700 },
            total: {
              show: true,
              label: 'Total',
              fontSize: '13px',
              color: theme.palette.text.secondary,
              formatter: () => String(totalBookings),
            },
          },
        },
      },
    },
    tooltip: { theme: theme.palette.mode === 'dark' ? 'dark' : 'light' },
  };

  const areaOptions: Record<string, unknown> = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: theme.palette.text.secondary,
    },
    colors: [primary, secondary],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      strokeDashArray: 4,
      borderColor: alpha(theme.palette.divider, 0.8),
    },
    xaxis: {
      categories: weeklyTrend.map((day) => day.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      { title: { text: 'Bookings' } },
      { opposite: true, title: { text: 'Revenue (₹)' } },
    ],
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: (value: number, { seriesIndex }: { seriesIndex: number }) =>
          seriesIndex === 1 ? formatCurrency(value) : String(value),
      },
    },
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <DashboardCard title="Booking Status" subtitle="Distribution across workflow stages">
          <Box sx={{ height: 300 }}>
            <Chart options={donutOptions} series={statusSeries} type="donut" height={300} />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Revenue collected: {formatCurrency(revenue)}
            </Typography>
          </Stack>
        </DashboardCard>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <DashboardCard title="7-Day Booking Trend" subtitle="Daily bookings and revenue from recent activity">
          <Box sx={{ height: 300 }}>
            <Chart
              options={areaOptions}
              series={[
                { name: 'Bookings', type: 'area', data: weeklyTrend.map((day) => day.count) },
                { name: 'Revenue', type: 'area', data: weeklyTrend.map((day) => day.revenue) },
              ]}
              type="area"
              height={300}
            />
          </Box>
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
