'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Card,
  Grid,
} from '@mui/material';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import PasswordTextField from '@/components/forms/PasswordTextField';
import AuthLogo from '@/app/(DashboardLayout)/layout/shared/logo/LogoDark';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/authentication/login'), 2000);
    } catch {
      setError('Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        '&:before': {
          content: '""',
          background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
          position: 'absolute',
          height: '100%',
          width: '100%',
          opacity: '0.3',
        },
      }}
    >
      <Grid container spacing={0} sx={{ height: '100vh', justifyContent: 'center' }}>
        <Grid
          size={{ xs: 12, sm: 12, lg: 4, xl: 3 }}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: '500px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
              <AuthLogo />
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
              Reset Password
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
              Enter the 6-digit code from your email and choose a new password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password updated! Redirecting to sign in...
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" component="label" htmlFor="email" sx={{ fontWeight: 500, mb: '5px' }}>
                    Email
                  </Typography>
                  <CustomTextField
                    id="email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" component="label" htmlFor="code" sx={{ fontWeight: 500, mb: '5px' }}>
                    Reset Code
                  </Typography>
                  <CustomTextField
                    id="code"
                    variant="outlined"
                    fullWidth
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' } }}
                    placeholder="000000"
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" component="label" htmlFor="newPassword" sx={{ fontWeight: 500, mb: '5px' }}>
                    New Password
                  </Typography>
                  <PasswordTextField
                    id="newPassword"
                    variant="outlined"
                    fullWidth
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" component="label" htmlFor="confirmPassword" sx={{ fontWeight: 500, mb: '5px' }}>
                    Confirm Password
                  </Typography>
                  <PasswordTextField
                    id="confirmPassword"
                    variant="outlined"
                    fullWidth
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Box>
                <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={loading || success}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Stack>
            </form>

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 3 }}>
              <Typography variant="body2">
                <Link href="/authentication/forgot-password" style={{ color: 'inherit' }}>
                  Resend code
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">·</Typography>
              <Typography variant="body2">
                <Link href="/authentication/login" style={{ color: 'inherit' }}>
                  Back to sign in
                </Link>
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
