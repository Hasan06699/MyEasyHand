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
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { IconTrash, IconEdit } from '@tabler/icons-react';
import { planApi, PlanItem } from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  billingCycle: 'monthly' as const,
  durationDays: 30,
  maxEmployees: 5,
  maxServices: 10,
  maxBanners: 3,
  maxServiceRows: 2,
  maxBookingsPerMonth: '',
  features: '',
  isActive: true,
  sortOrder: 0,
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await planApi.list();
      return res.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        durationDays: Number(form.durationDays),
        limits: {
          maxEmployees: Number(form.maxEmployees),
          maxServices: Number(form.maxServices),
          maxBanners: Number(form.maxBanners),
          maxServiceRows: Number(form.maxServiceRows),
          ...(form.maxBookingsPerMonth ? { maxBookingsPerMonth: Number(form.maxBookingsPerMonth) } : {}),
        },
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) {
        return planApi.update(editing._id, payload);
      }
      return planApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save plan';
      setError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const openEdit = (plan: PlanItem) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      durationDays: plan.durationDays,
      maxEmployees: plan.limits.maxEmployees,
      maxServices: plan.limits.maxServices,
      maxBanners: plan.limits.maxBanners ?? 0,
      maxServiceRows: plan.limits.maxServiceRows ?? 0,
      maxBookingsPerMonth: plan.limits.maxBookingsPerMonth?.toString() || '',
      features: plan.features.join('\n'),
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setError('');
    setOpen(true);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Subscription Plans
        </Typography>
        <Button variant="contained" onClick={openCreate}>
          Add Plan
        </Button>
      </Stack>

      <DashboardCard title="All Plans">
        {isLoading && <Typography>Loading...</Typography>}
        {data && (
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Employees</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Banners</TableCell>
                  <TableCell>Service Rows</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No plans found</TableCell>
                  </TableRow>
                ) : (
                  data.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <Typography fontWeight={600}>{plan.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{plan.description}</Typography>
                      </TableCell>
                      <TableCell>{formatPrice(plan.price)} / {plan.billingCycle}</TableCell>
                      <TableCell>{plan.durationDays} days</TableCell>
                      <TableCell>{plan.limits.maxEmployees}</TableCell>
                      <TableCell>{plan.limits.maxServices}</TableCell>
                      <TableCell>{plan.limits.maxBanners ?? '—'}</TableCell>
                      <TableCell>{plan.limits.maxServiceRows ?? '—'}</TableCell>
                      <TableCell>
                        <Chip label={plan.isActive ? 'Active' : 'Inactive'} size="small" color={plan.isActive ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(plan)}><IconEdit size={18} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(plan._id)}><IconTrash size={18} /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Price (INR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} fullWidth required />
              <TextField select label="Billing Cycle" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value as 'monthly' | 'yearly' })} fullWidth>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Duration (days)" type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} fullWidth required />
              <TextField label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Max Employees" type="number" value={form.maxEmployees} onChange={(e) => setForm({ ...form, maxEmployees: Number(e.target.value) })} fullWidth required />
              <TextField label="Max Services" type="number" value={form.maxServices} onChange={(e) => setForm({ ...form, maxServices: Number(e.target.value) })} fullWidth required />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Max Banners" type="number" value={form.maxBanners} onChange={(e) => setForm({ ...form, maxBanners: Number(e.target.value) })} fullWidth required />
              <TextField label="Max Service Rows" type="number" value={form.maxServiceRows} onChange={(e) => setForm({ ...form, maxServiceRows: Number(e.target.value) })} fullWidth required />
            </Stack>
            <TextField label="Max Bookings / Month" type="number" value={form.maxBookingsPerMonth} onChange={(e) => setForm({ ...form, maxBookingsPerMonth: e.target.value })} fullWidth />
            <TextField label="Features (one per line)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} fullWidth multiline rows={4} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
            <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Plan' : 'Create Plan'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
