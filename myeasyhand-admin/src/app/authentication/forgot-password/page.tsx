'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    router.push(`/authentication/reset-password?email=${encodeURIComponent(email.trim())}`);
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
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Smart Booking. Trusted Services.
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
              Forgot Password
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
              Enter your email and we&apos;ll send a 6-digit reset code.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {sent ? (
              <Stack spacing={2}>
                <Alert severity="success">
                  If an account exists for that email, a reset code has been sent. Check your inbox.
                </Alert>
                <Button variant="contained" fullWidth onClick={goToReset}>
                  Enter Reset Code
                </Button>
              </Stack>
            ) : (
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
                  <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </Button>
                </Stack>
              </form>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
              <Link href="/authentication/login" style={{ color: 'inherit' }}>
                Back to sign in
              </Link>
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
