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
  TextField,
  Stack,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { IconEye, IconPlayerPlay, IconPlayerPause, IconPlus, IconEdit, IconKey, IconBriefcase, IconFileText, IconUsersGroup } from '@tabler/icons-react';
import PasswordTextField from '@/components/forms/PasswordTextField';
import { serviceOwnerApi, categoryApi, planApi, ServiceOwnerListItem, ServiceOwnerFormData, BusinessDocumentItem } from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useRouter } from 'next/navigation';

const emptyForm: ServiceOwnerFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  city: '',
  state: '',
  status: 'active',
  planId: '',
};

function docStatusColor(status: BusinessDocumentItem['status']): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected' || status === 'expired') return 'error';
  return 'default';
}

export default function ServiceOwnersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [autoApprove, setAutoApprove] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOwnerListItem | null>(null);
  const [form, setForm] = useState<ServiceOwnerFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordOwner, setPasswordOwner] = useState<ServiceOwnerListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsOwner, setDocsOwner] = useState<ServiceOwnerListItem | null>(null);
  const [selected, setSelected] = useState<ServiceOwnerListItem | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories-for-owners'],
    queryFn: async () => {
      const res = await categoryApi.list();
      return res.data.data;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans-for-owners'],
    queryFn: async () => {
      const res = await planApi.list();
      return res.data.data;
    },
  });

  const { data: owners, isLoading } = useQuery({
    queryKey: ['service-owners', search, status, city, categoryId, autoApprove],
    queryFn: async () => {
      const res = await serviceOwnerApi.list({
        search: search || undefined,
        status: status || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        autoApprove: autoApprove === '' ? undefined : autoApprove === 'true',
      });
      return res.data.data;
    },
  });

  const autoApproveMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      serviceOwnerApi.setAutoApprove(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
      setActionError('');
    },
    onError: (err: unknown) => {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to update auto approval',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'activate' }) =>
      action === 'suspend' ? serviceOwnerApi.suspend(id) : serviceOwnerApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
      setActionError('');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof serviceOwnerApi.create>[0]) => serviceOwnerApi.create(data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
      queryClient.invalidateQueries({ queryKey: ['service-owners-for-filter'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-service-owners'] });
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create service owner',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof serviceOwnerApi.update>[1] }) =>
      serviceOwnerApi.update(id, data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
      queryClient.invalidateQueries({ queryKey: ['service-owners-for-filter'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-service-owners'] });
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to update service owner',
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      serviceOwnerApi.resetPassword(id, password),
    onSuccess: () => {
      closePasswordDialog();
    },
    onError: (err: unknown) => {
      setPasswordError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to reset password',
      );
    },
  });

  const { data: ownerDocuments = [], isLoading: docsLoading } = useQuery({
    queryKey: ['owner-documents', docsOwner?._id],
    queryFn: async () =>
      (await serviceOwnerApi.listDocuments({ ownerId: docsOwner!._id })).data.data,
    enabled: docsOpen && !!docsOwner?._id,
  });

  const approveDocMutation = useMutation({
    mutationFn: (id: string) => serviceOwnerApi.approveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-documents', docsOwner?._id] });
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
    },
  });

  const rejectDocMutation = useMutation({
    mutationFn: (id: string) => serviceOwnerApi.rejectDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-documents', docsOwner?._id] });
      queryClient.invalidateQueries({ queryKey: ['service-owners'] });
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
  }

  function closePasswordDialog() {
    setPasswordOpen(false);
    setPasswordOwner(null);
    setNewPassword('');
    setPasswordError('');
  }

  function openDocs(owner: ServiceOwnerListItem) {
    setDocsOwner(owner);
    setDocsOpen(true);
  }

  function openEdit(owner: ServiceOwnerListItem) {
    setEditing(owner);
    setForm({
      email: owner.owner.email,
      password: '',
      firstName: owner.owner.firstName,
      lastName: owner.owner.lastName,
      phone: owner.owner.phone ?? '',
      businessName: owner.business.name,
      businessEmail: owner.business.email,
      businessPhone: owner.business.phone ?? '',
      city: owner.business.address?.city ?? '',
      state: owner.business.address?.state ?? '',
      status: owner.owner.status,
      planId: owner.subscription?.planId ?? '',
    });
    setFormError('');
    setDialogOpen(true);
  }

  function openResetPassword(owner: ServiceOwnerListItem) {
    setPasswordOwner(owner);
    setNewPassword('');
    setPasswordError('');
    setPasswordOpen(true);
  }

  function openCreate() {
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.businessName) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (editing) {
      updateMutation.mutate({
        id: editing._id,
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          status: form.status as 'active' | 'inactive' | 'suspended',
          businessName: form.businessName.trim(),
          businessEmail: form.businessEmail.trim() || undefined,
          businessPhone: form.businessPhone.trim() || undefined,
          address:
            form.city.trim() || form.state.trim()
              ? {
                  ...(form.city.trim() ? { city: form.city.trim() } : {}),
                  ...(form.state.trim() ? { state: form.state.trim() } : {}),
                }
              : undefined,
          ...(form.planId ? { planId: form.planId } : {}),
        },
      });
      return;
    }

    if (!form.email || !form.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
      businessName: form.businessName.trim(),
      businessEmail: form.businessEmail.trim() || undefined,
      businessPhone: form.businessPhone.trim() || undefined,
      address:
        form.city.trim() || form.state.trim()
          ? {
              ...(form.city.trim() ? { city: form.city.trim() } : {}),
              ...(form.state.trim() ? { state: form.state.trim() } : {}),
            }
          : undefined,
    });
  }

  function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!passwordOwner) return;
    resetPasswordMutation.mutate({ id: passwordOwner._id, password: newPassword });
  }

  const openProfile = (owner: ServiceOwnerListItem) => {
    setSelected(owner);
    setProfileOpen(true);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Service Owners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage owners, auto-approval, and document verification
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate}>
          Add Owner
        </Button>
      </Stack>
      <Box sx={{ mb: 3 }} />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <DashboardCard title="Owner Directory">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Search"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, phone"
            sx={{ minWidth: 200 }}
          />
          <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </TextField>
          <TextField label="City" size="small" value={city} onChange={(e) => setCity(e.target.value)} sx={{ minWidth: 140 }} />
          <TextField select label="Category" size="small" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            {categories?.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Auto Approval" size="small" value={autoApprove} onChange={(e) => setAutoApprove(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Enabled</MenuItem>
            <MenuItem value="false">Disabled</MenuItem>
          </TextField>
        </Stack>

        {isLoading && <Typography>Loading...</Typography>}
        {owners && (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Owner</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Featured / Popular</TableCell>
                  <TableCell>Auto Approve</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Docs</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {owners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No service owners found
                    </TableCell>
                  </TableRow>
                ) : (
                  owners.map((o) => (
                    <TableRow key={o._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {o.owner.firstName} {o.owner.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.business.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.owner.email}</Typography>
                        <Typography variant="caption">{o.owner.phone || '—'}</Typography>
                      </TableCell>
                      <TableCell>{o.business.address?.city || '—'}</TableCell>
                      <TableCell>
                        {o.stats.activeServices}/{o.stats.totalServices}
                        {o.stats.pendingServices > 0 && (
                          <Chip label={`${o.stats.pendingServices} pending`} size="small" color="warning" sx={{ ml: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {o.stats.featuredServices} / {o.stats.popularServices}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={o.autoApproveServices}
                              onChange={(e) =>
                                autoApproveMutation.mutate({ id: o._id, enabled: e.target.checked })
                              }
                            />
                          }
                          label={o.autoApproveServices ? 'On' : 'Off'}
                        />
                      </TableCell>
                      <TableCell>
                        {o.subscription ? (
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{o.subscription.planName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {o.subscription.status}
                            </Typography>
                          </Stack>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={`${o.documentsApproved} ok`} size="small" color="success" />
                          {o.documentsPending > 0 && (
                            <Chip label={`${o.documentsPending} pending`} size="small" color="warning" />
                          )}
                          <IconButton size="small" onClick={() => openDocs(o)} title="View Documents">
                            <IconFileText size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={o.owner.status}
                          size="small"
                          color={o.owner.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openProfile(o)} title="View Profile">
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEdit(o)} title="Edit Owner">
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openResetPassword(o)} title="Reset Password">
                          <IconKey size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/services?ownerId=${o._id}`)}
                          title="View Services"
                        >
                          <IconBriefcase size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/employees?businessId=${o.business._id}`)}
                          title="View Employees"
                        >
                          <IconUsersGroup size={18} />
                        </IconButton>
                        {o.owner.status === 'active' ? (
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => statusMutation.mutate({ id: o._id, action: 'suspend' })}
                            title="Suspend"
                          >
                            <IconPlayerPause size={18} />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => statusMutation.mutate({ id: o._id, action: 'activate' })}
                            title="Activate"
                          >
                            <IconPlayerPlay size={18} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Owner Profile</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography>
                <strong>Name:</strong> {selected.owner.firstName} {selected.owner.lastName}
              </Typography>
              <Typography>
                <strong>Email:</strong> {selected.owner.email}
              </Typography>
              <Typography>
                <strong>Mobile:</strong> {selected.owner.phone || '—'}
              </Typography>
              <Typography>
                <strong>Address:</strong>{' '}
                {[selected.business.address?.street, selected.business.address?.city, selected.business.address?.state]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </Typography>
              <Typography>
                <strong>Business:</strong> {selected.business.name}
              </Typography>
              <Typography>
                <strong>Total Services:</strong> {selected.stats.totalServices} (Active: {selected.stats.activeServices}
                , Pending: {selected.stats.pendingServices})
              </Typography>
              <Typography>
                <strong>Auto Approval:</strong> {selected.autoApproveServices ? 'Enabled' : 'Disabled'}
              </Typography>
              <Typography>
                <strong>Documents:</strong> {selected.documentsApproved} approved, {selected.documentsPending} pending
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Service Owner' : 'Add Service Owner'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Owner Account
            </Typography>
            {!editing ? (
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
            ) : (
              <TextField label="Email" type="email" value={form.email} disabled fullWidth />
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
            {editing && (
              <>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Subscription Plan"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">No change</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
              Business Details
            </Typography>
            <TextField
              label="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Business Email"
              type="email"
              value={form.businessEmail}
              onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
              placeholder="Defaults to owner email if empty"
              fullWidth
            />
            <TextField
              label="Business Phone"
              value={form.businessPhone}
              onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
              placeholder="Defaults to owner phone if empty"
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : editing
                ? 'Save Changes'
                : 'Create Owner'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordOpen} onClose={closePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          {passwordOwner && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set a new password for {passwordOwner.owner.firstName} {passwordOwner.owner.lastName} (
              {passwordOwner.owner.email})
            </Typography>
          )}
          <PasswordTextField
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={docsOpen} onClose={() => setDocsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Documents{docsOwner ? ` — ${docsOwner.owner.firstName} ${docsOwner.owner.lastName}` : ''}
        </DialogTitle>
        <DialogContent>
          {docsLoading ? (
            <Typography sx={{ py: 2 }}>Loading documents...</Typography>
          ) : ownerDocuments.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No documents uploaded for this owner.
            </Typography>
          ) : (
            <Paper variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ownerDocuments.map((doc) => (
                    <TableRow key={doc._id} hover>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.category ?? 'business'}</TableCell>
                      <TableCell>{doc.fileName}</TableCell>
                      <TableCell>
                        <Chip label={doc.status} size="small" color={docStatusColor(doc.status)} />
                      </TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </Button>
                          {doc.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                color="success"
                                onClick={() => approveDocMutation.mutate(doc._id)}
                                disabled={approveDocMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => rejectDocMutation.mutate(doc._id)}
                                disabled={rejectDocMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
