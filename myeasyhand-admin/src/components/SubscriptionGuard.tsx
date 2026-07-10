'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

const ALLOWED_WITHOUT_SUBSCRIPTION = ['/subscriptions', '/settings', '/profile', '/notifications'];

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isBusinessOwner, isLoading, hasActiveSubscription } = useSubscriptionAccess();

  const isAllowed = ALLOWED_WITHOUT_SUBSCRIPTION.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  useEffect(() => {
    if (!isBusinessOwner || isLoading || hasActiveSubscription || isAllowed) return;
    router.replace('/subscriptions');
  }, [isBusinessOwner, isLoading, hasActiveSubscription, isAllowed, router]);

  if (isBusinessOwner && isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isBusinessOwner && !hasActiveSubscription && !isAllowed) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
