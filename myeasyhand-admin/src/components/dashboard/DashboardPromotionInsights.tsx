'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Typography, Stack, Button, Skeleton, LinearProgress, Grid } from '@mui/material';
import { formatCurrency } from '@/lib/format';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function DashboardPromotionInsights() {
  const theme = useTheme();
  const { canViewMarketing, promotionStats, isMarketingLoading } = useDashboardData();

  if (!canViewMarketing) return null;

  if (isMarketingLoading) {
    return <Skeleton variant="rounded" height={420} />;
  }

  if (!promotionStats) return null;

  const funnelLabels = ['Views', 'Clicks', 'Conversions', 'Coupon Uses'];
  const funnelValues = [
    promotionStats.totalViews,
    promotionStats.totalClicks,
    promotionStats.bookingConversions,
    promotionStats.couponUsage,
  ];

  const funnelOptions: Record<string, unknown> = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: theme.palette.text.secondary,
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '48%',
        distributed: true,
      },
    },
    colors: [
      theme.palette.info.main,
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.secondary.main,
    ],
    dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600 } },
    legend: { show: false },
    xaxis: {
      categories: funnelLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { strokeDashArray: 4, borderColor: alpha(theme.palette.divider, 0.8) },
    tooltip: { theme: theme.palette.mode === 'dark' ? 'dark' : 'light' },
  };

  const radialOptions: Record<string, unknown> = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    plotOptions: {
      radialBar: {
        hollow: { size: '58%' },
        dataLabels: {
          name: { fontSize: '14px', color: theme.palette.text.secondary },
          value: { fontSize: '24px', fontWeight: 700 },
          total: {
            show: true,
            label: 'CTR',
            formatter: () => `${promotionStats.clickThroughRate}%`,
          },
        },
      },
    },
    labels: ['Click-through rate'],
    colors: [theme.palette.primary.main],
  };

  const maxBannerClicks = Math.max(...promotionStats.topBanners.map((banner) => banner.clickCount), 1);

  return (
    <Stack spacing={3}>
      <DashboardCard
        title="Marketing Funnel"
        subtitle="Views to conversions across promotions"
        action={
          <Button component={Link} href="/promotions" size="small" variant="outlined">
            Manage
          </Button>
        }
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ height: 280 }}>
              <Chart options={funnelOptions} series={[{ name: 'Count', data: funnelValues }]} type="bar" height={280} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ height: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Chart options={radialOptions} series={[promotionStats.clickThroughRate]} type="radialBar" height={220} />
              <Stack spacing={1} sx={{ px: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Conversion rate: {promotionStats.conversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Promo revenue: {formatCurrency(promotionStats.revenueGenerated)}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DashboardCard>

      <DashboardCard title="Top Performing Banners">
        <Stack spacing={2}>
          {promotionStats.topBanners.map((banner) => {
            const clickRate = banner.viewCount > 0 ? (banner.clickCount / banner.viewCount) * 100 : 0;
            return (
              <Box key={banner._id}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {banner.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {banner.clickCount} clicks · {clickRate.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((banner.clickCount / maxBannerClicks) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    },
                  }}
                />
              </Box>
            );
          })}
          {!promotionStats.topBanners.length && (
            <Typography variant="body2" color="text.secondary">
              No promotion data yet
            </Typography>
          )}
        </Stack>
      </DashboardCard>

      {promotionStats.topServiceRows.length > 0 && (
        <DashboardCard title="Top Service Rows">
          <Stack spacing={1.5}>
            {promotionStats.topServiceRows.map((row) => (
              <Stack key={row._id} direction="row" sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.rowName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.rowTitle}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {row.clickCount} clicks
                </Typography>
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}
    </Stack>
  );
}
