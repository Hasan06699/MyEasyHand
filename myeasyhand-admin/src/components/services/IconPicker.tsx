'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  TextField,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { DEFAULT_CATEGORY_ICON, DEFAULT_SERVICE_ICON } from '@/lib/api';
import { FieldMessage } from './FieldHint';
import { searchIconifyIcons } from './iconify-search';
import {
  SERVICE_ICON_CATEGORIES,
  SERVICE_ICON_LIBRARIES,
  SERVICE_ICON_OPTIONS,
  IconCategory,
  IconLibrary,
  ServiceIconOption,
} from './service-icons';

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
  error?: string;
  defaultIcon?: string;
  helper?: string;
};

const LIBRARY_LABELS: Record<Exclude<IconLibrary, 'all'>, string> = {
  solar: 'Solar',
  hugeicons: 'Hugeicons',
  mdi: 'MDI',
  lucide: 'Lucide',
  tabler: 'Tabler',
  phosphor: 'Phosphor',
};

export default function IconPicker({
  value,
  onChange,
  error,
  defaultIcon = DEFAULT_SERVICE_ICON,
  helper = 'Browse curated icons or search Hugeicons, Material Design, Lucide, Tabler, Phosphor, and Solar.',
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<IconCategory>('all');
  const [library, setLibrary] = useState<IconLibrary>('all');
  const [searchResults, setSearchResults] = useState<ServiceIconOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const selected = value || defaultIcon;

  const curatedIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SERVICE_ICON_OPTIONS.filter((item) => {
      const matchLibrary = library === 'all' || item.library === library;
      const matchCategory = category === 'all' || item.category === category;
      const matchSearch =
        !q || item.label.toLowerCase().includes(q) || item.icon.toLowerCase().includes(q);
      return matchLibrary && matchCategory && matchSearch;
    });
  }, [search, category, library]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchIconifyIcons(q, library, controller.signal);
        setSearchResults(results);
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, library]);

  const displayIcons = search.trim().length >= 2 ? searchResults : curatedIcons;

  const handleClose = () => {
    setOpen(false);
    setSearch('');
    setCategory('all');
    setLibrary('all');
    setSearchResults([]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            border: '2px solid',
            borderColor: error ? 'error.main' : 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Icon icon={selected} width={28} />
        </Box>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Choose Icon
        </Button>
        {value && value !== defaultIcon && (
          <Button size="small" onClick={() => onChange('')}>
            Use default
          </Button>
        )}
      </Box>
      <FieldMessage error={error} helper={helper} />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Select Service Icon</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mb: 2, mt: 1 }}>
            <TextField
              size="small"
              placeholder="Search icons (e.g. cleaning, plumber, laptop)..."
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Typography variant="caption" color="text.secondary">
              Type 2+ characters to search thousands of icons from Iconify. Filter by library or category below.
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Library
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
            {SERVICE_ICON_LIBRARIES.map((lib) => (
              <Chip
                key={lib.id}
                label={lib.label}
                size="small"
                color={library === lib.id ? 'primary' : 'default'}
                variant={library === lib.id ? 'filled' : 'outlined'}
                onClick={() => setLibrary(lib.id)}
              />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Category
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
            {SERVICE_ICON_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                size="small"
                color={category === cat.id ? 'primary' : 'default'}
                variant={category === cat.id ? 'filled' : 'outlined'}
                onClick={() => setCategory(cat.id)}
                disabled={search.trim().length >= 2}
              />
            ))}
          </Stack>

          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : displayIcons.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              {search.trim().length >= 2
                ? 'No icons found. Try another keyword or library.'
                : 'No icons match the selected filters.'}
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {displayIcons.map((item) => (
                <Grid key={item.icon} size={{ xs: 4, sm: 3, md: 2 }}>
                  <Box
                    onClick={() => {
                      onChange(item.icon);
                      handleClose();
                    }}
                    title={`${item.label} (${item.icon})`}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: selected === item.icon ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: selected === item.icon ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Icon icon={item.icon} width={28} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.2 }}
                    >
                      {LIBRARY_LABELS[item.library]}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
