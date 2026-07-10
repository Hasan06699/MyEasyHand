'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useAuthStore } from '@/stores/auth.store';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import ProfileCompletionMeter from '@/components/settings/ProfileCompletionMeter';
import VerificationBadges from '@/components/settings/VerificationBadges';
import ProfileTab from '@/components/settings/ProfileTab';
import BusinessInfoTab from '@/components/settings/BusinessInfoTab';
import PaymentTab from '@/components/settings/PaymentTab';
import DocumentsTab from '@/components/settings/DocumentsTab';

const OWNER_TABS = [
  { label: 'Profile', value: 0 },
  { label: 'Business Info', value: 1 },
  { label: 'Payment', value: 2 },
  { label: 'Documents', value: 3 },
] as const;

function statusChip(status?: string) {
  if (!status) return null;
  const color = status === 'active' || status === 'approved' ? 'success'
    : status === 'pending' || status === 'under_review' ? 'warning'
    : status === 'rejected' || status === 'suspended' || status === 'blocked' ? 'error'
    : 'default';
  return <Chip label={status.replace('_', ' ')} size="small" color={color} />;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const isBusinessOwner = user?.roleSlugs?.includes('business_owner');
  const { data: overview } = useOwnerProfile();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'documents') setTab(3);
    else if (tabParam === 'payment') setTab(2);
    else if (tabParam === 'business') setTab(1);
    else if (tabParam === 'profile') setTab(0);
  }, [searchParams]);

  const visibleTabs = isBusinessOwner ? OWNER_TABS : [{ label: 'Profile', value: 0 }];

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Profile & Settings</Typography>
        {isBusinessOwner && overview && (
          <Stack direction="row" spacing={1}>
            {statusChip(overview.accountStatus)}
            {statusChip(overview.kycStatus)}
            {statusChip(overview.publishStatus)}
          </Stack>
        )}
      </Stack>

      {isBusinessOwner && overview && (
        <>
          <VerificationBadges badges={overview.badges} />
          <ProfileCompletionMeter completion={overview.completion} />
        </>
      )}

      <DashboardCard>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }} variant="scrollable">
          {visibleTabs.map((item) => (
            <Tab key={item.value} label={item.label} value={item.value} />
          ))}
        </Tabs>

        {tab === 0 && <ProfileTab />}
        {isBusinessOwner && tab === 1 && <BusinessInfoTab />}
        {isBusinessOwner && tab === 2 && <PaymentTab />}
        {isBusinessOwner && tab === 3 && <DocumentsTab />}
      </DashboardCard>
    </Box>
  );
}
