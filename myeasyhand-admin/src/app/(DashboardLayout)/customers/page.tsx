'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  DialogActions,
  TextField,
  Stack,
  MenuItem,
  IconButton,
  Alert,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconEye, IconKey } from '@tabler/icons-react';
import PasswordTextField from '@/components/forms/PasswordTextField';
import {
  customerApi,
  CustomerItem,
  CustomerFormData,
  CustomerDetail,
} from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const emptyForm: CustomerFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
};

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'warning';
  if (status === 'inactive') return 'error';
  return 'default';
}

function bookingStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'error';
  if (status === 'in_progress') return 'info';
  if (status === 'confirmed') return 'success';
  if (status === 'pending') return 'warning';
  return 'default';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount,
  );
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [editStatus, setEditStatus] = useState('active');
  const [error, setError] = useState('');
  const [viewPasswordOpen, setViewPasswordOpen] = useState(false);
  const [viewPasswordTarget, setViewPasswordTarget] = useState<CustomerItem | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [revealedPassword, setRevealedPassword] = useState('');
  const [viewPasswordError, setViewPasswordError] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => (await customerApi.stats()).data.data,
  });

  const { data: customers = [], isPending, isFetching } = useQuery({
    queryKey: ['customers', filterStatus, search],
    queryFn: async () =>
      (
        await customerApi.list(1, {
          ...(filterStatus ? { status: filterStatus } : {}),
          ...(search ? { search } : {}),
        })
      ).data.data,
    placeholderData: keepPreviousData,
  });

  const { data: detail } = useQuery({
    queryKey: ['customer-detail', selectedId],
    queryFn: async () => (await customerApi.get(selectedId!)).data.data,
    enabled: !!selectedId && detailOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => customerApi.create(data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      customerApi.update(id, data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedId] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      if (detailOpen) setDetailOpen(false);
    },
  });

  const viewPasswordMutation = useMutation({
    mutationFn: ({ id, adminPassword }: { id: string; adminPassword: string }) =>
      customerApi.viewPassword(id, adminPassword),
    onSuccess: (res) => {
      setRevealedPassword(res.data.data.password);
      setViewPasswordError('');
      setAdminPassword('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setViewPasswordError(err.response?.data?.message ?? 'Failed to view password');
      setRevealedPassword('');
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setEditStatus('active');
    setError('');
  }

  useEffect(() => {
    if (dialogOpen || detailOpen) return;

    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.mainwrapper, .page-wrapper').forEach((el) => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
  }, [dialogOpen, detailOpen]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setEditStatus('active');
    setError('');
    setDialogOpen(true);
  }

  function openEdit(customer: CustomerItem) {
    setEditing(customer);
    setForm({
      email: customer.email,
      password: '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone ?? '',
    });
    setEditStatus(customer.status);
    setError('');
    setDialogOpen(true);
  }

  function openDetail(customer: CustomerItem) {
    setSelectedId(customer._id);
    setDetailTab(0);
    setDetailOpen(true);
  }

  function openViewPassword(customer: CustomerItem) {
    setViewPasswordTarget(customer);
    setAdminPassword('');
    setRevealedPassword('');
    setViewPasswordError('');
    setViewPasswordOpen(true);
  }

  function closeViewPasswordDialog() {
    setViewPasswordOpen(false);
    setViewPasswordTarget(null);
    setAdminPassword('');
    setRevealedPassword('');
    setViewPasswordError('');
  }

  function handleSubmit() {
    if (editing) {
      const data: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        status: editStatus,
      };
      if (form.password.trim()) {
        data.password = form.password;
      }
      updateMutation.mutate({
        id: editing._id,
        data,
      });
    } else {
      createMutation.mutate({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
      });
    }
  }

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer accounts and view booking history
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate}>
          Add Customer
        </Button>
      </Stack>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total', value: stats.total, color: 'primary.main' },
            { label: 'Active', value: stats.active, color: 'success.main' },
            { label: 'Inactive', value: stats.inactive, color: 'error.main' },
            { label: 'Suspended', value: stats.suspended, color: 'warning.main' },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <DashboardCard title="Customer Directory">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
        </Stack>

        {isPending && customers.length === 0 ? (
          <Typography>Loading...</Typography>
        ) : (
          <Paper variant="outlined" sx={{ overflowX: 'auto', opacity: isFetching ? 0.7 : 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Bookings</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {customer.firstName} {customer.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{customer.phone || '—'}</TableCell>
                      <TableCell>{customer.bookingCount}</TableCell>
                      <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={customer.status} color={statusColor(customer.status)} />
                      </TableCell>
                      <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openDetail(customer)} title="View details">
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEdit(customer)} title="Edit">
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (confirm('Remove this customer?')) deleteMutation.mutate(customer._id);
                          }}
                          title="Delete"
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editing && (
              <>
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  fullWidth
                />
                <PasswordTextField
                  label="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  fullWidth
                />
              </>
            )}
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
            {editing && (
              <>
                <PasswordTextField
                  label="New Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  fullWidth
                  helperText="Leave blank to keep current password"
                />
                <Button
                  variant="outlined"
                  startIcon={<IconKey size={18} />}
                  onClick={() => openViewPassword(editing)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  View Current Password
                </Button>
                <TextField
                  select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {detail ? (
            <CustomerDetailView
              detail={detail}
              tab={detailTab}
              onTabChange={setDetailTab}
              onViewPassword={() => openViewPassword(detail)}
            />
          ) : (
            <Typography sx={{ py: 4, textAlign: 'center' }}>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewPasswordOpen} onClose={closeViewPasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>View Customer Password</DialogTitle>
        <DialogContent>
          {viewPasswordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {viewPasswordError}
            </Alert>
          )}
          {viewPasswordTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your admin password to view the login password for{' '}
              <strong>
                {viewPasswordTarget.firstName} {viewPasswordTarget.lastName}
              </strong>
              .
            </Typography>
          )}
          {!revealedPassword ? (
            <PasswordTextField
              label="Your Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              fullWidth
              autoFocus
            />
          ) : (
            <PasswordTextField
              label="Customer Password"
              value={revealedPassword}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewPasswordDialog}>{revealedPassword ? 'Close' : 'Cancel'}</Button>
          {!revealedPassword ? (
            <Button
              variant="contained"
              onClick={() => {
                if (!viewPasswordTarget || !adminPassword.trim()) {
                  setViewPasswordError('Admin password is required');
                  return;
                }
                viewPasswordMutation.mutate({
                  id: viewPasswordTarget._id,
                  adminPassword,
                });
              }}
              disabled={viewPasswordMutation.isPending}
            >
              Verify & View
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CustomerDetailView({
  detail,
  tab,
  onTabChange,
  onViewPassword,
}: {
  detail: CustomerDetail;
  tab: number;
  onTabChange: (v: number) => void;
  onViewPassword: () => void;
}) {
  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {detail.firstName} {detail.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {detail.email} {detail.phone ? `· ${detail.phone}` : ''}
        </Typography>
        <Chip size="small" label={detail.status} color={statusColor(detail.status)} sx={{ width: 'fit-content' }} />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Total Bookings', value: detail.stats.totalBookings },
          { label: 'Completed', value: detail.stats.completedBookings },
          { label: 'Cancelled', value: detail.stats.cancelledBookings },
          { label: 'Total Spent', value: formatCurrency(detail.stats.totalSpent) },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => onTabChange(v)} sx={{ mb: 2 }}>
        <Tab label="Profile" />
        <Tab label={`Bookings (${detail.bookings.length})`} />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Email verified:</strong> {detail.isEmailVerified ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2">
            <strong>Password login:</strong> {detail.hasPassword ? 'Yes' : 'No'}
          </Typography>
          {detail.hasPassword ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconKey size={16} />}
              onClick={onViewPassword}
              disabled={detail.canViewPassword === false}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              {detail.canViewPassword === false
                ? 'Password not viewable (set a new password first)'
                : 'View Password'}
            </Button>
          ) : null}
          <Typography variant="body2">
            <strong>Joined:</strong> {new Date(detail.createdAt).toLocaleString()}
          </Typography>
          {detail.lastLoginAt && (
            <Typography variant="body2">
              <strong>Last login:</strong> {new Date(detail.lastLoginAt).toLocaleString()}
            </Typography>
          )}
        </Stack>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Booking #</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No bookings yet
                  </TableCell>
                </TableRow>
              ) : (
                detail.bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>{booking.bookingNumber}</TableCell>
                    <TableCell>{booking.serviceId?.name ?? '—'}</TableCell>
                    <TableCell>{new Date(booking.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={booking.status.replace('_', ' ')}
                        color={bookingStatusColor(booking.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
