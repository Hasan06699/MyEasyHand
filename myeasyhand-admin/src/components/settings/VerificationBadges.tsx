'use client';

import { Chip, Stack } from '@mui/material';
import { VerificationBadges as Badges } from '@/lib/api';

const BADGE_CONFIG: Array<{
  key: keyof Badges;
  label: string;
  color: 'success' | 'default' | 'primary';
}> = [
  { key: 'emailVerified', label: 'Email Verified', color: 'success' },
  { key: 'mobileVerified', label: 'Mobile Verified', color: 'success' },
  { key: 'kycVerified', label: 'KYC Verified', color: 'success' },
  { key: 'gstVerified', label: 'GST Verified', color: 'success' },
  { key: 'businessVerified', label: 'Business Verified', color: 'primary' },
  { key: 'premiumPartner', label: 'Premium Partner', color: 'primary' },
];

export default function VerificationBadges({ badges }: { badges: Badges }) {
  return (
    <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap', mb: 3 }}>
      {BADGE_CONFIG.map(({ key, label, color }) => (
        <Chip
          key={key}
          label={label}
          size="small"
          color={badges[key] ? color : 'default'}
          variant={badges[key] ? 'filled' : 'outlined'}
        />
      ))}
    </Stack>
  );
}
