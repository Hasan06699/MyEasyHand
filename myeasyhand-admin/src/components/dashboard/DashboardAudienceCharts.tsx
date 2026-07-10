'use client';

import dynamic from 'next/dynamic';
import { useTheme } from '@mui/material/styles';
import { Box, Grid, Skeleton } from '@mui/material';
import { CustomerStats, EmployeeStats, CouponStats } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type AudienceChartsProps = {
  customerStats?: CustomerStats;
  employeeStats?: EmployeeStats;
  couponStats?: CouponStats;
  loading?: boolean;
};

export default function DashboardAudienceCharts({
  customerStats,
  employeeStats,
  couponStats,
  loading,
}: AudienceChartsProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((key) => (
          <Grid key={key} size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const baseDonutOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { position: 'bottom' as const, fontSize: '12px' },
    tooltip: { theme: theme.palette.mode === 'dark' ? 'dark' : 'light' },
  };

  const customerOptions: Record<string, unknown> = {
    ...baseDonutOptions,
    labels: ['Active', 'Inactive', 'Suspended'],
    colors: [theme.palette.success.main, theme.palette.grey[400], theme.palette.error.main],
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Customers',
              formatter: () => String(customerStats?.total ?? 0),
            },
          },
        },
      },
    },
  };

  const employeeOptions: Record<string, unknown> = {
    ...baseDonutOptions,
    labels: ['Active', 'On Leave', 'Other'],
    colors: [theme.palette.primary.main, theme.palette.warning.main, theme.palette.info.main],
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Employees',
              formatter: () => String(employeeStats?.total ?? 0),
            },
          },
        },
      },
    },
  };

  const topCoupons = couponStats?.topPerformingCoupons ?? [];
  const couponBarOptions: Record<string, unknown> = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '55%' } },
    colors: [theme.palette.secondary.main],
    dataLabels: { enabled: false },
    xaxis: {
      categories: topCoupons.map((coupon) => coupon.code ?? coupon.name ?? 'Coupon'),
    },
    grid: { strokeDashArray: 4 },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: (value: number) => `${value} uses`,
      },
    },
  };

  const otherEmployees = Math.max(
    (employeeStats?.total ?? 0) - (employeeStats?.active ?? 0) - (employeeStats?.onLeave ?? 0),
    0,
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardCard title="Customers" subtitle="Account status breakdown">
          <Box sx={{ height: 260 }}>
            <Chart
              options={customerOptions}
              series={[
                customerStats?.active ?? 0,
                customerStats?.inactive ?? 0,
                customerStats?.suspended ?? 0,
              ]}
              type="donut"
              height={260}
            />
          </Box>
        </DashboardCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardCard title="Employees" subtitle="Team availability overview">
          <Box sx={{ height: 260 }}>
            <Chart
              options={employeeOptions}
              series={[
                employeeStats?.active ?? 0,
                employeeStats?.onLeave ?? 0,
                otherEmployees,
              ]}
              type="donut"
              height={260}
            />
          </Box>
        </DashboardCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardCard
          title="Coupon Performance"
          subtitle={`${formatCurrency(couponStats?.totalDiscountGiven ?? 0)} total discount`}
        >
          <Box sx={{ height: 260 }}>
            {topCoupons.length > 0 ? (
              <Chart
                options={couponBarOptions}
                series={[{ name: 'Uses', data: topCoupons.map((coupon) => coupon.usageCount) }]}
                type="bar"
                height={260}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No coupon usage data yet
              </Box>
            )}
          </Box>
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
