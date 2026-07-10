'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';

type FieldHintProps = {
  label: string;
  hint: string;
  required?: boolean;
};

export function FieldHint({ label, hint, required }: FieldHintProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
      <Typography variant="body2" fontWeight={500}>
        {label}
        {required && (
          <Typography component="span" color="error.main">
            {' '}
            *
          </Typography>
        )}
      </Typography>
      <Tooltip title={hint} arrow placement="top">
        <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help', lineHeight: 0 }}>
          <IconInfoCircle size={16} />
        </Box>
      </Tooltip>
    </Box>
  );
}

type FieldMessageProps = {
  error?: string;
  helper?: string;
};

export function FieldMessage({ error, helper }: FieldMessageProps) {
  if (!error && !helper) return null;
  return (
    <Typography
      variant="caption"
      sx={{ display: 'block', mt: 0.5, color: error ? 'error.main' : 'text.secondary' }}
    >
      {error || helper}
    </Typography>
  );
}
