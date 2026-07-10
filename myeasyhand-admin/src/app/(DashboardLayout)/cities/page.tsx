'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { cityApi, CityItem, getApiErrorMessage } from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const emptyForm = {
  name: '',
  state: '',
  country: 'India',
  sortOrder: 0,
  isActive: true,
};

export default function CitiesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CityItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities-admin'],
    queryFn: async () => {
      const res = await cityApi.listAdmin(true);
      return res.data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return cityApi.update(editing._id, form);
      }
      return cityApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities-admin'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cityApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities-admin'] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const openEdit = (city: CityItem) => {
    setEditing(city);
    setForm({
      name: city.name,
      state: city.state || '',
      country: city.country || 'India',
      sortOrder: city.sortOrder ?? 0,
      isActive: city.isActive,
    });
    setError('');
    setOpen(true);
  };

  return (
    <DashboardCard
      title="Cities / Locations"
      action={
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate}>
          Add City
        </Button>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Open cities where customers can book services (e.g. Indore, Bhopal, Delhi). Services are
        shown only in cities you assign them to.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>City</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading…</TableCell>
              </TableRow>
            )}
            {!isLoading && cities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No cities yet. Add Indore, Bhopal, Delhi, etc.</TableCell>
              </TableRow>
            )}
            {cities.map((city) => (
              <TableRow key={city._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{city.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {city.slug}
                  </Typography>
                </TableCell>
                <TableCell>{city.state || '—'}</TableCell>
                <TableCell>{city.sortOrder}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={city.isActive ? 'Active' : 'Inactive'}
                    color={city.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(city)}>
                    <IconEdit size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (confirm(`Delete ${city.name}?`)) deleteMutation.mutate(city._id);
                    }}
                  >
                    <IconTrash size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit City' : 'Add City'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="City name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Indore"
              fullWidth
            />
            <TextField
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="Madhya Pradesh"
              fullWidth
            />
            <TextField
              label="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              fullWidth
            />
            <TextField
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active (visible to customers)"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={!form.name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {editing ? 'Save' : 'Create'}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </DashboardCard>
  );
}
