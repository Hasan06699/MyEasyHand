'use client';

import { Typography, Box } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {title}
      </Typography>
      <DashboardCard title={title}>
        <Typography color="textSecondary">Coming in Phase 3 — {title} management</Typography>
      </DashboardCard>
    </Box>
  );
}
