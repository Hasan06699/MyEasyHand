'use client';

import { ReactNode } from 'react';
import { Box, DialogTitle, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';

export default function DialogHeader({
  title,
  onClose,
  actions,
}: {
  title: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  return (
    <DialogTitle
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
        pr: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
        <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {title}
        </Box>
        {actions}
      </Box>
      <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ mt: -0.5 }}>
        <IconX size={20} />
      </IconButton>
    </DialogTitle>
  );
}
