'use client';

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
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  bookingApi,
  employeeApi,
  BookingItem,
  EmployeeItem,
  BOOKING_STATUSES,
  BookingDetail,
} from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'> = {
  pending: 'warning',
  accepted: 'info',
  rejected: 'error',
  employee_assigned: 'info',
  employee_accepted: 'info',
  visit_scheduled: 'primary',
  visit_started: 'primary',
  service_in_progress: 'primary',
  awaiting_customer_approval: 'warning',
  approved: 'success',
  completed: 'success',
  paid: 'success',
  closed: 'default',
  cancelled: 'error',
  no_show: 'error',
  rescheduled: 'warning',
  refunded: 'error',
  confirmed: 'info',
  in_progress: 'primary',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function employeeName(emp: EmployeeItem): string {
  return `${emp.userId.firstName} ${emp.userId.lastName}`;
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDialog, setAssignDialog] = useState<BookingItem | null>(null);
  const [detailDialog, setDetailDialog] = useState<string | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<BookingItem | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId) setDetailDialog(bookingId);
  }, [searchParams]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: async () => {
      const res = await bookingApi.list(1, statusFilter === 'all' ? undefined : statusFilter);
      return res.data.data;
    },
  });

  const { data: bookingDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['booking-detail', detailDialog],
    queryFn: async () => (await bookingApi.get(detailDialog!)).data.data,
    enabled: !!detailDialog,
  });

  const { data: serviceStaff } = useQuery({
    queryKey: ['service-staff'],
    queryFn: async () => (await employeeApi.listServiceStaff()).data.data,
    enabled: !!assignDialog,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    if (detailDialog) queryClient.invalidateQueries({ queryKey: ['booking-detail', detailDialog] });
  };

  const acceptMutation = useMutation({
    mutationFn: (id: string) => bookingApi.accept(id),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => bookingApi.reject(id),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingApi.updateStatus(id, status),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, employeeIds, teamLeaderId }: { id: string; employeeIds: string[]; teamLeaderId?: string }) =>
      bookingApi.assign(id, employeeIds, teamLeaderId),
    onSuccess: () => {
      invalidate();
      setAssignDialog(null);
      setSelectedEmployees([]);
      setTeamLeaderId('');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, method }: { id: string; amount: number; method: string }) =>
      bookingApi.recordPayment(id, { amount, method }),
    onSuccess: () => {
      invalidate();
      setPaymentDialog(null);
      setPaymentAmount('');
    },
  });

  function renderDetail(detail: BookingDetail) {
    const { booking, lineItems, assignments, materials, payments, statusHistory } = detail;
    return (
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={formatStatus(booking.status)} color={STATUS_COLORS[booking.status] ?? 'default'} />
          <Chip label={`Payment: ${booking.paymentStatus}`} variant="outlined" size="small" />
          {booking.orderGroupId && <Chip label={`Group: ${booking.orderGroupId}`} variant="outlined" size="small" />}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Update Status</InputLabel>
            <Select
              label="Update Status"
              value={booking.status}
              onChange={(e) =>
                updateMutation.mutate({ id: booking._id, status: e.target.value })
              }
            >
              {BOOKING_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {formatStatus(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="body2">
          <strong>Customer:</strong> {booking.customerId?.firstName} {booking.customerId?.lastName} (
          {booking.customerId?.email})
        </Typography>
        <Typography variant="body2">
          <strong>Scheduled:</strong> {new Date(booking.scheduledAt).toLocaleString('en-IN')}
        </Typography>
        {booking.visitScheduledAt && (
          <Typography variant="body2">
            <strong>Visit:</strong> {new Date(booking.visitScheduledAt).toLocaleString('en-IN')}
          </Typography>
        )}
        <Typography variant="body2">
          <strong>Amount:</strong> ₹{booking.totalAmount}
          {booking.paidAmount ? ` (Paid: ₹${booking.paidAmount})` : ''}
        </Typography>

        {lineItems.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2">Services</Typography>
            {lineItems.map((item) => (
              <Typography key={item._id} variant="body2">
                {item.serviceName} × {item.quantity} — ₹{item.totalPrice}
              </Typography>
            ))}
          </>
        )}

        {assignments.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2">Assigned Employees</Typography>
            {assignments.map((a) => (
              <Typography key={a._id} variant="body2">
                {a.userId?.firstName} {a.userId?.lastName}
                {a.isTeamLeader ? ' (Team Leader)' : ''} — {a.employeeResponse}
              </Typography>
            ))}
          </>
        )}

        {materials.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2">Materials</Typography>
            {materials.map((m) => (
              <Typography key={m._id} variant="body2">
                {m.name} × {m.quantity} — ₹{m.totalPrice}
              </Typography>
            ))}
          </>
        )}

        {payments.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2">Payments</Typography>
            {payments.map((p) => (
              <Typography key={p._id} variant="body2">
                ₹{p.amount} via {p.method} — {new Date(p.createdAt).toLocaleString('en-IN')}
              </Typography>
            ))}
          </>
        )}

        {statusHistory.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2">Status History</Typography>
            {statusHistory.map((h) => (
              <Typography key={h._id} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {h.fromStatus ? `${formatStatus(h.fromStatus)} → ` : ''}
                {formatStatus(h.toStatus)} — {new Date(h.createdAt).toLocaleString('en-IN')}
              </Typography>
            ))}
          </>
        )}
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Bookings
      </Typography>

      <Tabs
        value={statusFilter}
        onChange={(_, v) => setStatusFilter(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="All" value="all" />
        {['pending', 'accepted', 'employee_assigned', 'visit_scheduled', 'service_in_progress', 'awaiting_customer_approval', 'completed', 'cancelled'].map(
          (s) => (
            <Tab key={s} label={formatStatus(s)} value={s} sx={{ textTransform: 'capitalize' }} />
          ),
        )}
      </Tabs>

      <DashboardCard title="All Bookings">
        {isLoading && <Typography>Loading...</Typography>}
        {bookings && (
          <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No bookings yet
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>
                        <Button size="small" onClick={() => setDetailDialog(b._id)}>
                          {b.bookingNumber}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {b.customerId ? `${b.customerId.firstName} ${b.customerId.lastName}` : '—'}
                      </TableCell>
                      <TableCell>{b.serviceId?.name || '—'}</TableCell>
                      <TableCell>
                        {b.employeeId ? (
                          <Chip
                            size="small"
                            label={`${b.employeeId.firstName} ${b.employeeId.lastName}`}
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Chip size="small" label="Unassigned" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(b.scheduledAt).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        ₹{b.totalAmount}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {b.paymentStatus}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={formatStatus(b.status)}
                          color={STATUS_COLORS[b.status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {b.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                color="success"
                                onClick={() => acceptMutation.mutate(b._id)}
                                disabled={acceptMutation.isPending}
                              >
                                Accept
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => rejectMutation.mutate(b._id)}
                                disabled={rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {['accepted', 'employee_assigned', 'pending', 'confirmed'].includes(b.status) && (
                            <Button size="small" variant="outlined" onClick={() => setAssignDialog(b)}>
                              Assign
                            </Button>
                          )}
                          {['completed', 'approved', 'partial_paid'].includes(b.status) ||
                          (b.paymentStatus !== 'paid' && b.status === 'completed') ? (
                            <Button size="small" variant="outlined" onClick={() => setPaymentDialog(b)}>
                              Payment
                            </Button>
                          ) : null}
                          <Select
                            size="small"
                            value={b.status}
                            onChange={(e) => updateMutation.mutate({ id: b._id, status: e.target.value })}
                            sx={{ minWidth: 140 }}
                          >
                            {BOOKING_STATUSES.map((s) => (
                              <MenuItem key={s} value={s}>
                                {formatStatus(s)}
                              </MenuItem>
                            ))}
                          </Select>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {detailLoading && <Typography>Loading...</Typography>}
          {bookingDetail && renderDetail(bookingDetail)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onClose={() => setAssignDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Service Staff</DialogTitle>
        <DialogContent>
          {assignDialog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Booking: {assignDialog.bookingNumber}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Employees</InputLabel>
                <Select
                  multiple
                  value={selectedEmployees}
                  onChange={(e) => setSelectedEmployees(e.target.value as string[])}
                  input={<OutlinedInput label="Employees" />}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((id) => (serviceStaff ?? []).find((e) => e._id === id))
                      .filter(Boolean)
                      .map((e) => employeeName(e!))
                      .join(', ')
                  }
                >
                  {(serviceStaff ?? []).map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      <Checkbox checked={selectedEmployees.includes(emp._id)} />
                      <ListItemText primary={employeeName(emp)} secondary={emp.designation} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedEmployees.length > 1 && (
                <FormControl fullWidth>
                  <InputLabel>Team Leader</InputLabel>
                  <Select
                    value={teamLeaderId}
                    onChange={(e) => setTeamLeaderId(e.target.value)}
                    label="Team Leader"
                  >
                    {selectedEmployees.map((id) => {
                      const emp = (serviceStaff ?? []).find((e) => e._id === id);
                      return emp ? (
                        <MenuItem key={id} value={id}>
                          {employeeName(emp)}
                        </MenuItem>
                      ) : null;
                    })}
                  </Select>
                </FormControl>
              )}
              {(serviceStaff ?? []).length === 0 && (
                <Typography variant="caption" color="warning.main">
                  No active service staff available. Add employees first.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={selectedEmployees.length === 0 || assignMutation.isPending}
            onClick={() => {
              if (assignDialog) {
                assignMutation.mutate({
                  id: assignDialog._id,
                  employeeIds: selectedEmployees,
                  teamLeaderId: teamLeaderId || selectedEmployees[0],
                });
              }
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onClose={() => setPaymentDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {paymentDialog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Total: ₹{paymentDialog.totalAmount}
                {paymentDialog.paidAmount ? ` | Paid: ₹${paymentDialog.paidAmount}` : ''}
              </Typography>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select value={paymentMethod} label="Method" onChange={(e) => setPaymentMethod(e.target.value)}>
                  {['cash', 'upi', 'credit_card', 'debit_card', 'net_banking', 'wallet'].map((m) => (
                    <MenuItem key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!paymentAmount || paymentMutation.isPending}
            onClick={() => {
              if (paymentDialog) {
                paymentMutation.mutate({
                  id: paymentDialog._id,
                  amount: parseFloat(paymentAmount),
                  method: paymentMethod,
                });
              }
            }}
          >
            Record
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
