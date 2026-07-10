'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { ProfileCompletion } from '@/lib/api';

const SECTIONS: Array<{ key: keyof ProfileCompletion; label: string }> = [
  { key: 'personal', label: 'Personal Profile' },
  { key: 'business', label: 'Business Information' },
  { key: 'payment', label: 'Payment Details' },
  { key: 'documents', label: 'Documents' },
];

export default function ProfileCompletionMeter({ completion }: { completion: ProfileCompletion }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Profile Completion: {completion.overall}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={completion.overall}
        sx={{ height: 10, borderRadius: 5, mb: 2 }}
      />
      <Stack spacing={1.5}>
        {SECTIONS.map(({ key, label }) => (
          <Box key={key}>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={600}>{completion[key]}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={completion[key]} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
