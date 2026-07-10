'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loadUser, accessToken } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/authentication/login');
        return;
      }
      await loadUser();
      setChecking(false);
    };
    check();
  }, [accessToken, loadUser, router]);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace('/authentication/login');
    }
  }, [checking, isAuthenticated, router]);

  if (checking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
