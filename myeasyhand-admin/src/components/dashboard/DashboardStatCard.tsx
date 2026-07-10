'use client';

import { alpha, useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Box, Avatar } from '@mui/material';
import { Icon } from '@iconify/react';

type DashboardStatCardProps = {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
};

export default function DashboardStatCard({ label, value, icon, color, subtitle }: DashboardStatCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        border: `1px solid ${alpha(color, 0.18)}`,
        background: `linear-gradient(145deg, ${alpha(color, 0.1)} 0%, ${theme.palette.background.paper} 55%)`,
        boxShadow: `0 8px 24px ${alpha(color, 0.08)}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 28px ${alpha(color, 0.14)}`,
        },
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: alpha(color, 0.15),
              color,
            }}
          >
            <Icon icon={icon} width={26} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}
