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
  Alert,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { IconRefresh, IconTrash, IconX, IconCheck, IconEdit } from '@tabler/icons-react';
import {
  subscriptionApi,
  planApi,
  businessApi,
  planRequestApi,
  SubscriptionItem,
  PlanItem,
  PlanRequestItem,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

function statusColor(status: SubscriptionItem['status']) {
  if (status === 'active' || status === 'trial') return 'success';
  if (status === 'past_due') return 'warning';
  if (status === 'cancelled' || status === 'expired') return 'error';
  return 'default';
}

const emptyAssignForm = {
  businessId: '',
  planId: '',
  status: 'active',
  expiresAt: '',
  notes: '',
};

function PlanCard({
  plan,
  actionLabel,
  onAction,
  disabled,
  isCurrent,
}: {
  plan: PlanItem;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  isCurrent?: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
          {isCurrent && <Chip label="Current" size="small" color="primary" />}
        </Stack>
        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
          {formatPrice(plan.price)}
          <Typography component="span" variant="body2" color="text.secondary"> / {plan.billingCycle}</Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{plan.description}</Typography>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="body2">• Up to {plan.limits.maxEmployees} employees</Typography>
          <Typography variant="body2">• Up to {plan.limits.maxServices} services</Typography>
          <Typography variant="body2">• Up to {plan.limits.maxBanners ?? 0} banners</Typography>
          <Typography variant="body2">• Up to {plan.limits.maxServiceRows ?? 0} service rows</Typography>
          <Typography variant="body2">• {plan.durationDays} days validity</Typography>
          {plan.features.slice(0, 3).map((feature) => (
            <Typography key={feature} variant="body2">• {feature}</Typography>
          ))}
        </Stack>
        <Button variant="contained" fullWidth onClick={onAction} disabled={disabled || isCurrent}>
          {isCurrent ? 'Current Plan' : actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function OwnerSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { hasActiveSubscription, subscription, pendingRequest } = useSubscriptionAccess();
  const [requestNote, setRequestNote] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<'activate' | 'upgrade'>('activate');
  const [error, setError] = useState('');

  const { data: plans } = useQuery({
    queryKey: ['plans-public'],
    queryFn: async () => {
      const res = await planApi.listPublic();
      return res.data.data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: () => planRequestApi.create({
      planId: selectedPlan!._id,
      type: requestType,
      note: requestNote || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['plan-requests'] });
      setRequestOpen(false);
      setSelectedPlan(null);
      setRequestNote('');
      setError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit request';
      setError(message);
    },
  });

  const openRequest = (plan: PlanItem, type: 'activate' | 'upgrade') => {
    setSelectedPlan(plan);
    setRequestType(type);
    setRequestNote('');
    setError('');
    setRequestOpen(true);
  };

  const currentPlanId = subscription?.planId?._id || (subscription?.planId as unknown as PlanItem)?._id;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Subscriptions
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {hasActiveSubscription
          ? 'Manage your plan or request an upgrade anytime.'
          : 'Request a plan to activate your account and unlock all features.'}
      </Typography>

      {pendingRequest && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your <strong>{pendingRequest.type}</strong> request for <strong>{pendingRequest.planId.name}</strong> is pending admin approval.
        </Alert>
      )}

      {hasActiveSubscription && subscription && (
        <Box sx={{ mb: 3 }}>
          <DashboardCard title="Current Subscription">
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="h6">{subscription.planId?.name || 'Plan'}</Typography>
              <Chip label={subscription.status} size="small" color={statusColor(subscription.status)} />
            </Stack>
            <Typography>Expires: {formatDate(subscription.expiresAt)}</Typography>
            <Typography>
              Limits: {subscription.planId?.limits?.maxEmployees} employees, {subscription.planId?.limits?.maxServices} services
            </Typography>
          </Stack>
        </DashboardCard>
        </Box>
      )}

      {!hasActiveSubscription && !pendingRequest && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No active subscription. You can only view your account and request a plan until admin approves.
        </Alert>
      )}

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {hasActiveSubscription ? 'Upgrade Plan' : 'Available Plans'}
      </Typography>

      <Grid container spacing={3}>
        {plans?.map((plan) => (
          <Grid key={plan._id} size={{ xs: 12, md: 4 }}>
            <PlanCard
              plan={plan}
              isCurrent={currentPlanId === plan._id}
              actionLabel={hasActiveSubscription ? 'Request Upgrade' : 'Request Activation'}
              disabled={!!pendingRequest}
              onAction={() => openRequest(plan, hasActiveSubscription ? 'upgrade' : 'activate')}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {requestType === 'upgrade' ? 'Request Plan Upgrade' : 'Request Plan Activation'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {selectedPlan && (
              <Alert severity="info">
                You are requesting <strong>{selectedPlan.name}</strong> ({formatPrice(selectedPlan.price)}).
                Admin will review and activate your plan.
              </Alert>
            )}
            <TextField
              label="Note (optional)"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Add a message for admin..."
            />
            <Button
              variant="contained"
              onClick={() => requestMutation.mutate()}
              disabled={requestMutation.isPending || !selectedPlan}
            >
              {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function AdminPlanRequests({ requests, onReview }: {
  requests: PlanRequestItem[];
  onReview: () => void;
}) {
  const [reviewNote, setReviewNote] = useState('');
  const [selected, setSelected] = useState<PlanRequestItem | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      if (action === 'approve') {
        return planRequestApi.approve(selected._id, reviewNote || undefined);
      }
      return planRequestApi.reject(selected._id, reviewNote || undefined);
    },
    onSuccess: () => {
      onReview();
      setSelected(null);
      setReviewNote('');
    },
  });

  return (
    <>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Note</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No pending requests</TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req._id}>
                  <TableCell>{req.businessId?.name}</TableCell>
                  <TableCell>{req.requestedBy?.firstName} {req.requestedBy?.lastName}</TableCell>
                  <TableCell>{req.planId?.name}</TableCell>
                  <TableCell><Chip label={req.type} size="small" /></TableCell>
                  <TableCell>{req.note || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="success"
                      title="Approve"
                      onClick={() => { setSelected(req); setAction('approve'); }}
                    >
                      <IconCheck size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Reject"
                      onClick={() => { setSelected(req); setAction('reject'); }}
                    >
                      <IconX size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{action === 'approve' ? 'Approve Plan Request' : 'Reject Plan Request'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selected && (
              <Typography>
                {selected.businessId?.name} — {selected.type} — {selected.planId?.name}
              </Typography>
            )}
            <TextField
              label="Review note (optional)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Button
              variant="contained"
              color={action === 'approve' ? 'primary' : 'error'}
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? 'Saving...' : action === 'approve' ? 'Approve & Apply Plan' : 'Reject Request'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [editForm, setEditForm] = useState({
    planId: '',
    status: 'active',
    startDate: '',
    expiresAt: '',
    notes: '',
  });
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await subscriptionApi.list();
      return res.data.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await planApi.list();
      return res.data.data;
    },
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await businessApi.list();
      return res.data.data as Array<{ _id: string; name: string; email: string }>;
    },
  });

  const { data: planRequests } = useQuery({
    queryKey: ['plan-requests', 'pending'],
    queryFn: async () => {
      const res = await planRequestApi.list('pending');
      return res.data.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => subscriptionApi.assign({
      businessId: assignForm.businessId,
      planId: assignForm.planId,
      status: assignForm.status,
      expiresAt: assignForm.expiresAt || undefined,
      notes: assignForm.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setAssignOpen(false);
      setAssignForm(emptyAssignForm);
      setError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to assign subscription';
      setError(message);
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.renew(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const updateMutation = useMutation({
    mutationFn: () => subscriptionApi.update(editingSub!._id, {
      planId: editForm.planId || undefined,
      status: editForm.status,
      startDate: editForm.startDate || undefined,
      expiresAt: editForm.expiresAt || undefined,
      notes: editForm.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setEditOpen(false);
      setEditingSub(null);
      setEditError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update subscription';
      setEditError(message);
    },
  });

  const openEdit = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setEditForm({
      planId: sub.planId?._id || '',
      status: sub.status,
      startDate: sub.startDate ? sub.startDate.slice(0, 10) : '',
      expiresAt: sub.expiresAt ? sub.expiresAt.slice(0, 10) : '',
      notes: sub.notes || '',
    });
    setEditError('');
    setEditOpen(true);
  };

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ['plan-requests'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Subscriptions
        </Typography>
        <Button variant="contained" onClick={() => { setAssignOpen(true); setError(''); }}>
          Assign Subscription
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Active Subscriptions" />
        <Tab label={`Plan Requests${planRequests?.length ? ` (${planRequests.length})` : ''}`} />
      </Tabs>

      {tab === 0 && (
        <DashboardCard title="All Subscriptions">
          {isLoading && <Typography>Loading...</Typography>}
          {subscriptions && (
            <Paper variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Business</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No subscriptions found</TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub._id}>
                        <TableCell>
                          <Typography fontWeight={600}>{sub.businessId?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{sub.businessId?.email}</Typography>
                        </TableCell>
                        <TableCell>
                          {sub.ownerId?.firstName} {sub.ownerId?.lastName}
                        </TableCell>
                        <TableCell>{sub.planId?.name}</TableCell>
                        <TableCell>
                          <Chip label={sub.status} size="small" color={statusColor(sub.status)} />
                        </TableCell>
                        <TableCell>{formatDate(sub.expiresAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" title="Edit" onClick={() => openEdit(sub)}><IconEdit size={18} /></IconButton>
                          <IconButton size="small" title="Renew" onClick={() => renewMutation.mutate(sub._id)}><IconRefresh size={18} /></IconButton>
                          <IconButton size="small" title="Cancel" onClick={() => cancelMutation.mutate(sub._id)}><IconX size={18} /></IconButton>
                          <IconButton size="small" color="error" title="Delete" onClick={() => deleteMutation.mutate(sub._id)}><IconTrash size={18} /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </DashboardCard>
      )}

      {tab === 1 && (
        <DashboardCard title="Pending Plan Requests">
          <AdminPlanRequests requests={planRequests || []} onReview={refreshRequests} />
        </DashboardCard>
      )}

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Subscription to Owner</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField select label="Business" value={assignForm.businessId} onChange={(e) => setAssignForm({ ...assignForm, businessId: e.target.value })} fullWidth required>
              {businesses?.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.name} ({b.email})</MenuItem>
              ))}
            </TextField>
            <TextField select label="Plan" value={assignForm.planId} onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })} fullWidth required>
              {plans?.filter((p) => p.isActive).map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name} — {formatPrice(p.price)}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={assignForm.status} onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })} fullWidth>
              <MenuItem value="trial">Trial</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="past_due">Past Due</MenuItem>
            </TextField>
            <TextField label="Custom Expiry Date" type="date" value={assignForm.expiresAt} onChange={(e) => setAssignForm({ ...assignForm, expiresAt: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} fullWidth multiline rows={2} />
            <Button variant="contained" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !assignForm.businessId || !assignForm.planId}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Subscription'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Active Subscription</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}
            {editingSub && (
              <Alert severity="info">
                {editingSub.businessId?.name} — {editingSub.ownerId?.firstName} {editingSub.ownerId?.lastName}
              </Alert>
            )}
            <TextField select label="Plan" value={editForm.planId} onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })} fullWidth>
              {plans?.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name} — {formatPrice(p.price)}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} fullWidth>
              <MenuItem value="trial">Trial</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="past_due">Past Due</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </TextField>
            <TextField label="Start Date" type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Expiry Date" type="date" value={editForm.expiresAt} onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Admin Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} fullWidth multiline rows={2} />
            <Button variant="contained" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');

  if (isSuperAdmin) {
    return <AdminSubscriptionsPage />;
  }

  return <OwnerSubscriptionsPage />;
}
