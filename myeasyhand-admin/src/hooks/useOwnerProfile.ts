'use client';

import { useQuery } from '@tanstack/react-query';
import { ownerProfileApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useOwnerProfile() {
  const { user } = useAuthStore();
  const isBusinessOwner = user?.roleSlugs?.includes('business_owner');

  return useQuery({
    queryKey: ['owner-profile-overview'],
    queryFn: async () => (await ownerProfileApi.getOverview()).data.data,
    enabled: !!isBusinessOwner,
  });
}
