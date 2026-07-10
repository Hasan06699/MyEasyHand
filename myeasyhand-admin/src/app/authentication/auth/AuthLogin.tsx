'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  Alert,
} from '@mui/material';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import PasswordTextField from '@/components/forms/PasswordTextField';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

const AuthLogin = ({ title, subtitle, subtext }: { title?: string; subtitle?: React.ReactNode; subtext: React.ReactNode }) => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      router.push('/');
    } catch {
      // error set in store
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {title ? (
        <Typography variant="h2" sx={{ fontWeight: '700', mb: 1 }}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Stack>
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
        <Box sx={{ mt: '25px' }}>
          <Typography variant="subtitle1" component="label" htmlFor="password" sx={{ fontWeight: 500, mb: '5px' }}>
            Password
          </Typography>
          <PasswordTextField
            id="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
          <FormGroup>
            <FormControlLabel control={<Checkbox defaultChecked />} label="Remember this device" />
          </FormGroup>
          <Typography
            component={Link}
            href="/authentication/forgot-password"
            variant="subtitle2"
            sx={{ fontWeight: 500, textDecoration: 'none', color: 'primary.main' }}
          >
            Forgot password?
          </Typography>
        </Stack>
      </Stack>
      <Box>
        <Button color="primary" variant="contained" size="large" fullWidth type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </Box>
      {subtitle ?? null}
    </form>
  );
};

export default AuthLogin;
