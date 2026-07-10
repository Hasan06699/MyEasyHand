'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { platformSettingsApi } from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

export default function PlatformSettingsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings', 'auth'],
    queryFn: async () => {
      const res = await platformSettingsApi.getAuth();
      return res.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { otpVerificationEnabled?: boolean; googleLoginEnabled?: boolean }) =>
      platformSettingsApi.updateAuth(payload),
    onSuccess: () => {
      setMessage('Settings saved successfully');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to save settings');
      setMessage('');
    },
  });

  if (isLoading || !data) {
    return (
      <Box p={3}>
        <Typography>Loading platform settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Platform Settings
      </Typography>

      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <DashboardCard title="Customer Authentication">
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={data.otpVerificationEnabled}
                onChange={(_, checked) =>
                  saveMutation.mutate({ otpVerificationEnabled: checked })
                }
                disabled={saveMutation.isPending}
              />
            }
            label="Require OTP verification after registration"
          />
          <Typography variant="body2" color="text.secondary" pl={1}>
            When enabled, new customers must verify their email with a one-time code before signing in.
            When disabled, customers are signed in immediately after registration.
          </Typography>
        </Stack>
      </DashboardCard>
    </Box>
  );
}
