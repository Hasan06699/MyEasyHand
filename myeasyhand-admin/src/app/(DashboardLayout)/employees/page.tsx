'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Tooltip,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconChartBar, IconActivity } from '@tabler/icons-react';
import PasswordTextField from '@/components/forms/PasswordTextField';
import {
  employeeApi,
  EmployeeItem,
  EmployeeFormData,
  EmployeePerformance,
  EmployeeActivityItem,
  serviceOwnerApi,
} from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useAuthStore } from '@/stores/auth.store';

const emptyForm: EmployeeFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  employeeType: 'service_staff',
  designation: '',
  department: '',
  hireDate: '',
  notes: '',
  businessId: '',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function typeLabel(type: string): string {
  return type === 'office_staff' ? 'Office Staff' : 'Service Staff';
}

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'on_leave') return 'warning';
  if (status === 'terminated') return 'error';
  return 'default';
}

function employeeToForm(emp: EmployeeItem): Partial<EmployeeFormData> & { status?: string } {
  return {
    firstName: emp.userId.firstName,
    lastName: emp.userId.lastName,
    phone: emp.userId.phone ?? '',
    employeeType: emp.employeeType,
    designation: emp.designation,
    department: emp.department ?? '',
    hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().slice(0, 10) : '',
    notes: emp.notes ?? '',
    status: emp.status,
  };
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeItem | null>(null);
  const [selected, setSelected] = useState<EmployeeItem | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [form, setForm] = useState<EmployeeFormData>(emptyForm);
  const [editStatus, setEditStatus] = useState('active');
  const [error, setError] = useState('');

  useEffect(() => {
    const businessId = searchParams.get('businessId');
    if (businessId) setBusinessFilter(businessId);
  }, [searchParams]);

  const listParams = {
    ...(filterType ? { employeeType: filterType } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(search ? { search } : {}),
    ...(businessFilter ? { businessId: businessFilter } : {}),
  };

  const { data: serviceOwners } = useQuery({
    queryKey: ['service-owners-for-employees'],
    queryFn: async () => (await serviceOwnerApi.list()).data.data,
    enabled: isSuperAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ['employee-stats', businessFilter],
    queryFn: async () => (await employeeApi.stats(businessFilter ? { businessId: businessFilter } : undefined)).data.data,
  });

  const { data: employees = [], isPending, isFetching } = useQuery({
    queryKey: ['employees', filterType, filterStatus, search, businessFilter],
    queryFn: async () => (await employeeApi.list(1, listParams)).data.data,
    placeholderData: keepPreviousData,
  });

  const { data: performance } = useQuery({
    queryKey: ['employee-performance', selected?._id],
    queryFn: async () => (await employeeApi.performance(selected!._id)).data.data,
    enabled: !!selected && detailTab === 1,
  });

  const { data: activities } = useQuery({
    queryKey: ['employee-activities', selected?._id],
    queryFn: async () => (await employeeApi.activities(selected!._id)).data.data,
    enabled: !!selected && detailTab === 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => employeeApi.create(data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to update employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
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
    setForm({ ...emptyForm, businessId: businessFilter });
    setEditStatus('active');
    setError('');
    setDialogOpen(true);
  }

  function openEdit(emp: EmployeeItem) {
    const partial = employeeToForm(emp);
    setEditing(emp);
    setForm({
      ...emptyForm,
      ...partial,
      email: emp.userId.email,
      password: '',
      businessId: emp.businessId?._id ?? '',
    });
    setEditStatus(partial.status ?? 'active');
    setError('');
    setDialogOpen(true);
  }

  function openDetail(emp: EmployeeItem) {
    setSelected(emp);
    setDetailTab(0);
    setDetailOpen(true);
  }

  function handleSubmit() {
    if (editing) {
      const data: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        employeeType: form.employeeType,
        designation: form.designation,
        department: form.department || undefined,
        hireDate: form.hireDate || undefined,
        notes: form.notes || undefined,
        status: editStatus,
      };
      if (form.password.trim()) {
        data.password = form.password;
      }
      updateMutation.mutate({ id: editing._id, data });
    } else {
      if (isSuperAdmin && !form.businessId) {
        setError('Select a business owner before adding an employee');
        return;
      }
      createMutation.mutate({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        employeeType: form.employeeType,
        designation: form.designation,
        department: form.department || undefined,
        hireDate: form.hireDate || undefined,
        notes: form.notes || undefined,
        ...(form.businessId ? { businessId: form.businessId } : {}),
      });
    }
  }

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Employees
        </Typography>
        <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openCreate}>
          Add Employee
        </Button>
      </Stack>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total', value: stats.total, color: 'primary.main' },
            { label: 'Active', value: stats.active, color: 'success.main' },
            { label: 'On Leave', value: stats.onLeave, color: 'warning.main' },
            { label: 'Office Staff', value: stats.officeStaff, color: 'info.main' },
            { label: 'Service Staff', value: stats.serviceStaff, color: 'secondary.main' },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
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

      <DashboardCard title="Employee Directory">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {isSuperAdmin && (
            <TextField
              select
              size="small"
              label="Business / Owner"
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="">All Businesses</MenuItem>
              {serviceOwners?.map((item) => (
                <MenuItem key={item.business._id} value={item.business._id}>
                  {item.business.name} ({item.owner.firstName} {item.owner.lastName})
                </MenuItem>
              ))}
            </TextField>
          )}
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
            label="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="office_staff">Office Staff</MenuItem>
            <MenuItem value="service_staff">Service Staff</MenuItem>
          </TextField>
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
            <MenuItem value="on_leave">On Leave</MenuItem>
            <MenuItem value="terminated">Terminated</MenuItem>
          </TextField>
        </Stack>

        {isPending && employees.length === 0 ? (
          <Typography>Loading...</Typography>
        ) : (
          <Paper variant="outlined" sx={{ overflowX: 'auto', opacity: isFetching ? 0.7 : 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  {isSuperAdmin && <TableCell>Business</TableCell>}
                  <TableCell>Type</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 8 : 7} align="center">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp._id} hover>
                      <TableCell>{emp.employeeCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {emp.userId.firstName} {emp.userId.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.userId.email}
                        </Typography>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <Typography variant="body2">{emp.businessId?.name || '—'}</Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          size="small"
                          label={typeLabel(emp.employeeType)}
                          color={emp.employeeType === 'service_staff' ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{emp.designation}</TableCell>
                      <TableCell>{emp.department || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={emp.status.replace('_', ' ')} color={statusColor(emp.status)} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => openDetail(emp)}>
                            <IconChartBar size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(emp)}>
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm('Remove this employee?')) deleteMutation.mutate(emp._id);
                            }}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        scroll="paper"
      >
        <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {isSuperAdmin && !editing && (
              <TextField
                select
                label="Business / Owner"
                required
                fullWidth
                value={form.businessId}
                onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              >
                <MenuItem value="">Select business</MenuItem>
                {serviceOwners?.map((item) => (
                  <MenuItem key={item.business._id} value={item.business._id}>
                    {item.business.name} ({item.owner.firstName} {item.owner.lastName})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Login Email"
              type="email"
              required={!editing}
              fullWidth
              disabled={!!editing}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              helperText={editing ? 'Email cannot be changed here' : undefined}
            />
            <PasswordTextField
              label={editing ? 'New Password' : 'Password'}
              required={!editing}
              fullWidth
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText={
                editing
                  ? 'Leave blank to keep current password. Stored passwords cannot be viewed.'
                  : 'Minimum 8 characters'
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="First Name"
                required
                fullWidth
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <TextField
                label="Last Name"
                required
                fullWidth
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Stack>
            <TextField
              label="Phone"
              fullWidth
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Employee Type"
                required
                fullWidth
                value={form.employeeType}
                onChange={(e) =>
                  setForm({ ...form, employeeType: e.target.value as EmployeeFormData['employeeType'] })
                }
              >
                <MenuItem value="office_staff">Office Staff</MenuItem>
                <MenuItem value="service_staff">Service Staff (Technician)</MenuItem>
              </TextField>
              {editing && (
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                </TextField>
              )}
            </Stack>
            <TextField
              label="Designation"
              required
              fullWidth
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
            <TextField
              label="Department"
              fullWidth
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <TextField
              label="Hire Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.hireDate}
              onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            />
            <TextField
              label="Notes"
              multiline
              rows={2}
              fullWidth
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Save Changes' : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        disableScrollLock
        scroll="paper"
      >
        {selected && (
          <>
            <DialogTitle>
              {selected.userId.firstName} {selected.userId.lastName}
              <Typography variant="body2" color="text.secondary">
                {selected.employeeCode} · {typeLabel(selected.employeeType)} · {selected.designation}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Performance" icon={<IconChartBar size={16} />} iconPosition="start" />
                <Tab label="Activity Log" icon={<IconActivity size={16} />} iconPosition="start" />
              </Tabs>

              {detailTab === 0 && (
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Login Email
                      </Typography>
                      <Typography>{selected.userId.email}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Password
                      </Typography>
                      <Typography color="text.secondary">
                        Hidden for security — use Edit to set a new password
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography>{selected.userId.phone || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Department
                      </Typography>
                      <Typography>{selected.department || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Chip size="small" label={selected.status.replace('_', ' ')} color={statusColor(selected.status)} />
                    </Grid>
                  </Grid>
                  {selected.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography>{selected.notes}</Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {detailTab === 1 && performance && (
                <PerformancePanel data={performance} />
              )}

              {detailTab === 2 && activities && (
                <ActivityPanel items={activities} />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

function PerformancePanel({ data }: { data: EmployeePerformance }) {
  return (
    <Grid container spacing={2}>
      {[
        { label: 'Total Assigned', value: data.totalAssigned },
        { label: 'Completed', value: data.completed },
        { label: 'In Progress', value: data.inProgress },
        { label: 'Cancelled', value: data.cancelled },
        { label: 'Completion Rate', value: `${data.completionRate}%` },
        { label: 'Revenue Generated', value: `₹${data.revenueGenerated}` },
        { label: 'Avg Completion (days)', value: data.avgCompletionDays },
      ].map((item) => (
        <Grid key={item.label} size={{ xs: 6, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {item.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function ActivityPanel({ items }: { items: EmployeeActivityItem[] }) {
  if (items.length === 0) {
    return <Typography color="text.secondary">No activity recorded yet</Typography>;
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Paper key={item._id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
              {item.description && (
                <Typography variant="caption" color="text.secondary">
                  {item.description}
                </Typography>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
              {new Date(item.createdAt).toLocaleString('en-IN')}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
