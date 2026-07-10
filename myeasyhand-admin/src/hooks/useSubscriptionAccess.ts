'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useSubscriptionAccess() {
  const { user } = useAuthStore();
  const isBusinessOwner = user?.roleSlugs?.includes('business_owner');
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await subscriptionApi.getStatus();
      return res.data.data;
    },
    enabled: isBusinessOwner && !isSuperAdmin,
  });

  return {
    isLoading: isBusinessOwner && !isSuperAdmin ? isLoading : false,
    hasActiveSubscription: isSuperAdmin ? true : (data?.hasActiveSubscription ?? false),
    subscription: data?.subscription ?? null,
    pendingRequest: data?.pendingRequest ?? null,
    refetch,
    isBusinessOwner: !!isBusinessOwner && !isSuperAdmin,
  };
}
