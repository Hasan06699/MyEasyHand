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
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';
import { IconTrash, IconEdit, IconCopy, IconBan } from '@tabler/icons-react';
import {
  couponApi,
  CouponItem,
  CouponType,
  categoryApi,
  serviceApi,
  customerApi,
  serviceOwnerApi,
  CategoryItem,
  getCategoryParentId,
  orderCategoriesHierarchically,
} from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useAuthStore } from '@/stores/auth.store';

const COUPON_TYPES: { value: CouponType; label: string }[] = [
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'fixed_amount', label: 'Fixed Amount Discount' },
  { value: 'free_service', label: 'Free Service' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'first_booking', label: 'First Booking Discount' },
];

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  active: 'success',
  scheduled: 'info',
  draft: 'default',
  expired: 'error',
  disabled: 'warning',
};

type FormField =
  | 'name'
  | 'code'
  | 'couponType'
  | 'discountPercentage'
  | 'discountAmount'
  | 'maxDiscountAmount'
  | 'validityStartDate'
  | 'validityEndDate'
  | 'validityStartTime'
  | 'validityEndTime'
  | 'totalUsageLimit'
  | 'perCustomerLimit'
  | 'eligibleCustomerIds'
  | 'categoryIds'
  | 'subcategoryIds'
  | 'serviceIds'
  | 'businessIds'
  | 'cityNames'
  | 'areaNames';

const TAB_FIELDS: FormField[][] = [
  ['name', 'code'],
  ['discountPercentage', 'discountAmount', 'maxDiscountAmount'],
  ['validityStartDate', 'validityEndDate', 'validityStartTime', 'validityEndTime', 'totalUsageLimit', 'perCustomerLimit'],
  ['eligibleCustomerIds', 'categoryIds', 'subcategoryIds', 'serviceIds', 'businessIds', 'cityNames', 'areaNames'],
];

function toDateInput(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function toIdList(ids?: Array<string | { _id: string }>): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => (typeof id === 'string' ? id : id._id));
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  termsAndConditions: '',
  couponType: 'percentage' as CouponType,
  discountPercentage: 10,
  maxDiscountAmount: '',
  discountAmount: '',
  validityStartDate: '',
  validityEndDate: '',
  validityStartTime: '',
  validityEndTime: '',
  status: 'draft' as const,
  usageLimitType: 'unlimited' as const,
  totalUsageLimit: '',
  perCustomerLimit: '',
  minBookingAmount: '',
  maxBookingAmount: '',
  customerEligibility: 'all' as const,
  eligibleCustomerIds: [] as string[],
  serviceRestrictionType: 'all' as const,
  categoryIds: [] as string[],
  subcategoryIds: [] as string[],
  serviceIds: [] as string[],
  vendorRestrictionType: 'all' as const,
  businessIds: [] as string[],
  locationRestrictionType: 'all' as const,
  cityNames: '',
  areaNames: '',
  autoApplyMode: 'manual' as const,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function getDiscountLabel(coupon: CouponItem) {
  switch (coupon.couponType) {
    case 'percentage':
    case 'first_booking':
      return coupon.maxDiscountAmount
        ? `${coupon.discountPercentage}% (max ${formatCurrency(coupon.maxDiscountAmount)})`
        : `${coupon.discountPercentage}%`;
    case 'fixed_amount':
      return formatCurrency(coupon.discountAmount ?? 0);
    case 'cashback':
      return `${formatCurrency(coupon.discountAmount ?? 0)} cashback`;
    case 'free_service':
      return 'Free service';
    default:
      return '—';
  }
}

function parseApiErrors(err: unknown): { message: string; fieldErrors: Partial<Record<FormField, string>> } {
  const data = (err as {
    response?: { data?: { message?: string; errors?: Array<{ field?: string; message: string }> } };
  })?.response?.data;

  const fieldErrors: Partial<Record<FormField, string>> = {};
  if (data?.errors?.length) {
    for (const item of data.errors) {
      if (item.field && item.field in TAB_FIELDS.flat().reduce((acc, f) => ({ ...acc, [f]: true }), {})) {
        fieldErrors[item.field as FormField] = item.message;
      } else if (item.field) {
        fieldErrors[item.field as FormField] = item.message;
      }
    }
  }

  return {
    message: data?.message || 'Failed to save coupon',
    fieldErrors,
  };
}

function tabHasError(tabIndex: number, errors: Partial<Record<FormField, string>>) {
  return TAB_FIELDS[tabIndex].some((field) => !!errors[field]);
}

function firstErrorTab(errors: Partial<Record<FormField, string>>) {
  return TAB_FIELDS.findIndex((fields) => fields.some((field) => !!errors[field]));
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');
  const canManage = isSuperAdmin || user?.roleSlugs?.includes('business_owner');

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState<CouponItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['coupons', search],
    queryFn: async () => {
      const res = await couponApi.list({ search: search || undefined });
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['coupon-stats'],
    queryFn: async () => {
      const res = await couponApi.stats();
      return res.data.data;
    },
    enabled: !!canManage,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['coupon-categories'],
    queryFn: async () => {
      const res = await categoryApi.list({ includeInactive: true });
      return res.data.data;
    },
    enabled: open,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['coupon-services'],
    queryFn: async () => {
      const res = await serviceApi.list(1);
      return res.data.data;
    },
    enabled: open,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['coupon-customers'],
    queryFn: async () => {
      const res = await customerApi.list(1);
      return res.data.data;
    },
    enabled: open && form.customerEligibility === 'specific',
  });

  const { data: serviceOwners = [] } = useQuery({
    queryKey: ['coupon-service-owners'],
    queryFn: async () => {
      const res = await serviceOwnerApi.list();
      return res.data.data;
    },
    enabled: open && isSuperAdmin && form.vendorRestrictionType === 'selected',
  });

  const orderedCategories = orderCategoriesHierarchically(categories);
  const parentCategories = orderedCategories.filter((c) => !getCategoryParentId(c));
  const subCategories = orderedCategories.filter((c) => !!getCategoryParentId(c));

  const clearFieldError = (field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in fieldErrors) clearFieldError(key as FormField);
  };

  const fieldProps = (field: FormField) => ({
    error: !!fieldErrors[field],
    helperText: fieldErrors[field],
    onFocus: () => clearFieldError(field),
  });

  const buildPayload = () => ({
    name: form.name.trim(),
    code: form.code.toUpperCase().trim(),
    description: form.description || undefined,
    termsAndConditions: form.termsAndConditions || undefined,
    couponType: form.couponType,
    discountPercentage: ['percentage', 'first_booking'].includes(form.couponType)
      ? Number(form.discountPercentage)
      : undefined,
    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
    discountAmount: ['fixed_amount', 'cashback'].includes(form.couponType)
      ? Number(form.discountAmount)
      : undefined,
    validityStartDate: form.validityStartDate,
    validityEndDate: form.validityEndDate,
    validityStartTime: form.validityStartTime || undefined,
    validityEndTime: form.validityEndTime || undefined,
    status: form.status,
    usageLimitType: form.usageLimitType,
    totalUsageLimit: form.usageLimitType === 'total' && form.totalUsageLimit
      ? Number(form.totalUsageLimit)
      : undefined,
    perCustomerLimit:
      (form.usageLimitType === 'per_customer' || form.couponType === 'first_booking') && form.perCustomerLimit
        ? Number(form.perCustomerLimit)
        : undefined,
    minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined,
    maxBookingAmount: form.maxBookingAmount ? Number(form.maxBookingAmount) : undefined,
    customerEligibility: form.customerEligibility,
    eligibleCustomerIds:
      form.customerEligibility === 'specific' ? form.eligibleCustomerIds : [],
    serviceRestrictionType: form.serviceRestrictionType,
    categoryIds: form.serviceRestrictionType === 'categories' ? form.categoryIds : [],
    subcategoryIds: form.serviceRestrictionType === 'subcategories' ? form.subcategoryIds : [],
    serviceIds: form.serviceRestrictionType === 'services' ? form.serviceIds : [],
    vendorRestrictionType: form.vendorRestrictionType,
    businessIds: form.vendorRestrictionType === 'selected' ? form.businessIds : [],
    locationRestrictionType: form.locationRestrictionType,
    cityNames:
      form.locationRestrictionType === 'cities'
        ? form.cityNames.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    areaNames:
      form.locationRestrictionType === 'areas'
        ? form.areaNames.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    autoApplyMode: form.autoApplyMode,
  });

  const validateForm = (): boolean => {
    const errors: Partial<Record<FormField, string>> = {};

    if (!form.name.trim()) errors.name = 'Coupon name is required';
    if (!form.code.trim()) errors.code = 'Coupon code is required';
    if (!form.validityStartDate) errors.validityStartDate = 'Start date is required';
    if (!form.validityEndDate) errors.validityEndDate = 'End date is required';
    if (form.validityStartDate && form.validityEndDate && form.validityEndDate < form.validityStartDate) {
      errors.validityEndDate = 'End date must be on or after start date';
    }
    if (form.validityStartTime && !/^\d{1,2}:\d{2}$/.test(form.validityStartTime)) {
      errors.validityStartTime = 'Use HH:mm format (e.g. 09:00)';
    }
    if (form.validityEndTime && !/^\d{1,2}:\d{2}$/.test(form.validityEndTime)) {
      errors.validityEndTime = 'Use HH:mm format (e.g. 21:00)';
    }

    if (['percentage', 'first_booking'].includes(form.couponType)) {
      if (!form.discountPercentage && form.discountPercentage !== 0) {
        errors.discountPercentage = 'Discount percentage is required';
      }
    }
    if (['fixed_amount', 'cashback'].includes(form.couponType)) {
      if (!form.discountAmount) errors.discountAmount = 'Amount is required';
    }

    if (form.usageLimitType === 'total' && !form.totalUsageLimit) {
      errors.totalUsageLimit = 'Total usage limit is required';
    }
    if (form.usageLimitType === 'per_customer' && !form.perCustomerLimit) {
      errors.perCustomerLimit = 'Per customer limit is required';
    }

    if (form.customerEligibility === 'specific' && form.eligibleCustomerIds.length === 0) {
      errors.eligibleCustomerIds = 'Select at least one customer';
    }
    if (form.serviceRestrictionType === 'categories' && form.categoryIds.length === 0) {
      errors.categoryIds = 'Select at least one category';
    }
    if (form.serviceRestrictionType === 'subcategories' && form.subcategoryIds.length === 0) {
      errors.subcategoryIds = 'Select at least one subcategory';
    }
    if (form.serviceRestrictionType === 'services' && form.serviceIds.length === 0) {
      errors.serviceIds = 'Select at least one service';
    }
    if (form.vendorRestrictionType === 'selected' && form.businessIds.length === 0) {
      errors.businessIds = 'Select at least one owner';
    }
    if (form.locationRestrictionType === 'cities' && !form.cityNames.trim()) {
      errors.cityNames = 'Enter at least one city';
    }
    if (form.locationRestrictionType === 'areas' && !form.areaNames.trim()) {
      errors.areaNames = 'Enter at least one area';
    }

    setFieldErrors(errors);
    const errorTab = firstErrorTab(errors);
    if (errorTab >= 0) setTab(errorTab);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editing) return couponApi.update(editing._id, payload);
      return couponApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFieldErrors({});
      setSubmitError('');
      setTab(0);
    },
    onError: (err: unknown) => {
      const { message, fieldErrors: apiErrors } = parseApiErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...apiErrors }));
        const errorTab = firstErrorTab(apiErrors);
        if (errorTab >= 0) setTab(errorTab);
        setSubmitError('');
        return;
      }
      setSubmitError(message);
    },
  });

  const handleSave = () => {
    setSubmitError('');
    if (!validateForm()) return;
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => couponApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => couponApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setSubmitError('');
    setTab(0);
    setOpen(true);
  };

  const openEdit = (coupon: CouponItem) => {
    setEditing(coupon);
    setForm({
      name: coupon.name,
      code: coupon.code,
      description: coupon.description || '',
      termsAndConditions: coupon.termsAndConditions || '',
      couponType: coupon.couponType,
      discountPercentage: coupon.discountPercentage ?? 10,
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      discountAmount: coupon.discountAmount?.toString() || '',
      validityStartDate: toDateInput(coupon.validityStartDate),
      validityEndDate: toDateInput(coupon.validityEndDate),
      validityStartTime: coupon.validityStartTime || '',
      validityEndTime: coupon.validityEndTime || '',
      status: coupon.status,
      usageLimitType: coupon.usageLimitType,
      totalUsageLimit: coupon.totalUsageLimit?.toString() || '',
      perCustomerLimit: coupon.perCustomerLimit?.toString() || '',
      minBookingAmount: coupon.minBookingAmount?.toString() || '',
      maxBookingAmount: coupon.maxBookingAmount?.toString() || '',
      customerEligibility: coupon.customerEligibility,
      eligibleCustomerIds: toIdList(coupon.eligibleCustomerIds as Array<string | { _id: string }>),
      serviceRestrictionType: coupon.serviceRestrictionType,
      categoryIds: toIdList(coupon.categoryIds as Array<string | { _id: string }>),
      subcategoryIds: toIdList(coupon.subcategoryIds as Array<string | { _id: string }>),
      serviceIds: toIdList(coupon.serviceIds as Array<string | { _id: string }>),
      vendorRestrictionType: coupon.vendorRestrictionType,
      businessIds: toIdList(coupon.businessIds as Array<string | { _id: string }>),
      locationRestrictionType: coupon.locationRestrictionType,
      cityNames: coupon.cityNames?.join(', ') || '',
      areaNames: coupon.areaNames?.join(', ') || '',
      autoApplyMode: coupon.autoApplyMode,
    });
    setFieldErrors({});
    setSubmitError('');
    setTab(0);
    setOpen(true);
  };

  const showPercentageFields = ['percentage', 'first_booking'].includes(form.couponType);
  const showAmountFields = ['fixed_amount', 'cashback'].includes(form.couponType);

  const tabSx = (index: number) =>
    tabHasError(index, fieldErrors)
      ? { color: 'error.main', '&.Mui-selected': { color: 'error.main' } }
      : undefined;

  const renderMultiSelect = (
    field: 'categoryIds' | 'subcategoryIds' | 'serviceIds' | 'businessIds' | 'eligibleCustomerIds',
    label: string,
    options: { id: string; label: string }[],
  ) => (
    <Box>
      <TextField
        select
        fullWidth
        label={label}
        value={form[field]}
        onChange={(e) => {
          const value = e.target.value;
          updateForm(field, (typeof value === 'string' ? value.split(',') : value) as string[]);
        }}
        {...fieldProps(field)}
        SelectProps={{
          multiple: true,
          input: <OutlinedInput label={label} error={!!fieldErrors[field]} />,
          renderValue: (selected) => {
            const ids = selected as string[];
            return options
              .filter((o) => ids.includes(o.id))
              .map((o) => o.label)
              .join(', ');
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            <Checkbox checked={form[field].includes(option.id)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </TextField>
      {fieldErrors[field] && (
        <FormHelperText error sx={{ mx: 1.75 }}>
          {fieldErrors[field]}
        </FormHelperText>
      )}
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Coupon Management
        </Typography>
        {canManage && (
          <Button variant="contained" onClick={openCreate}>
            Create Coupon
          </Button>
        )}
      </Stack>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Coupons', value: stats.totalCoupons },
            { label: 'Active', value: stats.activeCoupons },
            { label: 'Total Uses', value: stats.totalUsageCount },
            { label: 'Discount Given', value: formatCurrency(stats.totalDiscountGiven) },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <DashboardCard title="All Coupons">
        <Stack direction="row" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        </Stack>

        {isLoading && <Typography>Loading...</Typography>}
        {data && (
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Coupon</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Validity</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} align="center">No coupons found</TableCell>
                  </TableRow>
                ) : (
                  data.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <Typography fontWeight={600}>{coupon.name}</Typography>
                        <Typography variant="caption" color="primary">{coupon.code}</Typography>
                      </TableCell>
                      <TableCell>
                        {COUPON_TYPES.find((t) => t.value === coupon.couponType)?.label ?? coupon.couponType}
                      </TableCell>
                      <TableCell>{getDiscountLabel(coupon)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(coupon.validityStartDate).toLocaleDateString()} – {new Date(coupon.validityEndDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {coupon.usageCount}
                        {coupon.totalUsageLimit ? ` / ${coupon.totalUsageLimit}` : ''}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.effectiveStatus ?? coupon.status}
                          size="small"
                          color={STATUS_COLORS[coupon.effectiveStatus ?? coupon.status] ?? 'default'}
                        />
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEdit(coupon)} title="Edit">
                            <IconEdit size={18} />
                          </IconButton>
                          <IconButton size="small" onClick={() => duplicateMutation.mutate(coupon._id)} title="Duplicate">
                            <IconCopy size={18} />
                          </IconButton>
                          <IconButton size="small" onClick={() => disableMutation.mutate(coupon._id)} title="Disable">
                            <IconBan size={18} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(coupon._id)} title="Delete">
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Basic" sx={tabSx(0)} />
            <Tab label="Discount" sx={tabSx(1)} />
            <Tab label="Validity & Usage" sx={tabSx(2)} />
            <Tab label="Restrictions" sx={tabSx(3)} />
          </Tabs>

          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            {tab === 0 && (
              <>
                <TextField
                  label="Coupon Name"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  fullWidth
                  required
                  {...fieldProps('name')}
                />
                <TextField
                  label="Coupon Code"
                  value={form.code}
                  onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                  fullWidth
                  required
                  helperText={fieldErrors.code || 'Unique code e.g. MYEASYHAND10'}
                  error={!!fieldErrors.code}
                  onFocus={() => clearFieldError('code')}
                />
                <TextField label="Description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} fullWidth multiline rows={2} />
                <TextField label="Terms & Conditions" value={form.termsAndConditions} onChange={(e) => updateForm('termsAndConditions', e.target.value)} fullWidth multiline rows={3} />
                <TextField select label="Coupon Type" value={form.couponType} onChange={(e) => updateForm('couponType', e.target.value as CouponType)} fullWidth>
                  {COUPON_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Status" value={form.status} onChange={(e) => updateForm('status', e.target.value as typeof form.status)} fullWidth>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="disabled">Disabled</MenuItem>
                </TextField>
              </>
            )}

            {tab === 1 && (
              <>
                {showPercentageFields && (
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Discount %"
                      type="number"
                      value={form.discountPercentage}
                      onChange={(e) => updateForm('discountPercentage', Number(e.target.value))}
                      fullWidth
                      {...fieldProps('discountPercentage')}
                    />
                    <TextField
                      label="Max Discount (₹)"
                      type="number"
                      value={form.maxDiscountAmount}
                      onChange={(e) => updateForm('maxDiscountAmount', e.target.value)}
                      fullWidth
                      {...fieldProps('maxDiscountAmount')}
                    />
                  </Stack>
                )}
                {showAmountFields && (
                  <TextField
                    label={form.couponType === 'cashback' ? 'Cashback Amount (₹)' : 'Discount Amount (₹)'}
                    type="number"
                    value={form.discountAmount}
                    onChange={(e) => updateForm('discountAmount', e.target.value)}
                    fullWidth
                    {...fieldProps('discountAmount')}
                  />
                )}
                {form.couponType === 'free_service' && (
                  <Alert severity="info">Free service coupon applies 100% discount on eligible booking amount.</Alert>
                )}
                <Stack direction="row" spacing={2}>
                  <TextField label="Min Booking Amount (₹)" type="number" value={form.minBookingAmount} onChange={(e) => updateForm('minBookingAmount', e.target.value)} fullWidth />
                  <TextField label="Max Booking Amount (₹)" type="number" value={form.maxBookingAmount} onChange={(e) => updateForm('maxBookingAmount', e.target.value)} fullWidth />
                </Stack>
              </>
            )}

            {tab === 2 && (
              <>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={form.validityStartDate}
                    onChange={(e) => updateForm('validityStartDate', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                    {...fieldProps('validityStartDate')}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={form.validityEndDate}
                    onChange={(e) => updateForm('validityEndDate', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                    {...fieldProps('validityEndDate')}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Start Time (HH:mm)"
                    value={form.validityStartTime}
                    onChange={(e) => updateForm('validityStartTime', e.target.value)}
                    fullWidth
                    placeholder="09:00"
                    {...fieldProps('validityStartTime')}
                  />
                  <TextField
                    label="End Time (HH:mm)"
                    value={form.validityEndTime}
                    onChange={(e) => updateForm('validityEndTime', e.target.value)}
                    fullWidth
                    placeholder="21:00"
                    {...fieldProps('validityEndTime')}
                  />
                </Stack>
                <TextField
                  select
                  label="Usage Limit"
                  value={form.usageLimitType}
                  onChange={(e) => updateForm('usageLimitType', e.target.value as typeof form.usageLimitType)}
                  fullWidth
                >
                  <MenuItem value="unlimited">Unlimited</MenuItem>
                  <MenuItem value="total">Total Usage Limit</MenuItem>
                  <MenuItem value="per_customer">Per Customer Limit</MenuItem>
                </TextField>
                {form.usageLimitType === 'total' && (
                  <TextField
                    label="Total Uses"
                    type="number"
                    value={form.totalUsageLimit}
                    onChange={(e) => updateForm('totalUsageLimit', e.target.value)}
                    fullWidth
                    {...fieldProps('totalUsageLimit')}
                  />
                )}
                {(form.usageLimitType === 'per_customer' || form.couponType === 'first_booking') && (
                  <TextField
                    label="Per Customer Limit"
                    type="number"
                    value={form.perCustomerLimit}
                    onChange={(e) => updateForm('perCustomerLimit', e.target.value)}
                    fullWidth
                    helperText={fieldErrors.perCustomerLimit || 'First booking coupons default to 1 use per customer'}
                    error={!!fieldErrors.perCustomerLimit}
                    onFocus={() => clearFieldError('perCustomerLimit')}
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.autoApplyMode === 'best'}
                      onChange={(e) => updateForm('autoApplyMode', e.target.checked ? 'best' : 'manual')}
                    />
                  }
                  label="Auto-apply best coupon (highest discount)"
                />
              </>
            )}

            {tab === 3 && (
              <>
                <TextField
                  select
                  label="Customer Eligibility"
                  value={form.customerEligibility}
                  onChange={(e) => {
                    const value = e.target.value as typeof form.customerEligibility;
                    updateForm('customerEligibility', value);
                    if (value !== 'specific') updateForm('eligibleCustomerIds', []);
                  }}
                  fullWidth
                >
                  <MenuItem value="all">All Customers</MenuItem>
                  <MenuItem value="new">New Customers</MenuItem>
                  <MenuItem value="existing">Existing Customers</MenuItem>
                  <MenuItem value="premium">Premium Customers</MenuItem>
                  <MenuItem value="specific">Specific Customers</MenuItem>
                </TextField>
                {form.customerEligibility === 'specific' &&
                  renderMultiSelect(
                    'eligibleCustomerIds',
                    'Select Customers',
                    customers.map((c) => ({
                      id: c._id,
                      label: `${c.firstName} ${c.lastName} (${c.email})`,
                    })),
                  )}

                <TextField
                  select
                  label="Service Restrictions"
                  value={form.serviceRestrictionType}
                  onChange={(e) => {
                    const value = e.target.value as typeof form.serviceRestrictionType;
                    setForm((prev) => ({
                      ...prev,
                      serviceRestrictionType: value,
                      categoryIds: value === 'categories' ? prev.categoryIds : [],
                      subcategoryIds: value === 'subcategories' ? prev.subcategoryIds : [],
                      serviceIds: value === 'services' ? prev.serviceIds : [],
                    }));
                    clearFieldError('categoryIds');
                    clearFieldError('subcategoryIds');
                    clearFieldError('serviceIds');
                  }}
                  fullWidth
                >
                  <MenuItem value="all">All Services</MenuItem>
                  <MenuItem value="categories">Selected Categories</MenuItem>
                  <MenuItem value="subcategories">Selected Subcategories</MenuItem>
                  <MenuItem value="services">Selected Services</MenuItem>
                </TextField>
                {form.serviceRestrictionType === 'categories' &&
                  renderMultiSelect(
                    'categoryIds',
                    'Select Categories',
                    parentCategories.map((c: CategoryItem) => ({ id: c._id, label: c.name })),
                  )}
                {form.serviceRestrictionType === 'subcategories' &&
                  renderMultiSelect(
                    'subcategoryIds',
                    'Select Subcategories',
                    subCategories.map((c) => ({
                      id: c._id,
                      label: getCategoryParentId(c)
                        ? `${categories.find((p) => p._id === getCategoryParentId(c))?.name ?? 'Category'} › ${c.name}`
                        : c.name,
                    })),
                  )}
                {form.serviceRestrictionType === 'services' &&
                  renderMultiSelect(
                    'serviceIds',
                    'Select Services',
                    services.map((s) => ({ id: s._id, label: s.name })),
                  )}

                {isSuperAdmin && (
                  <>
                    <TextField
                      select
                      label="Vendor Restrictions"
                      value={form.vendorRestrictionType}
                      onChange={(e) => {
                        const value = e.target.value as typeof form.vendorRestrictionType;
                        updateForm('vendorRestrictionType', value);
                        if (value !== 'selected') updateForm('businessIds', []);
                      }}
                      fullWidth
                    >
                      <MenuItem value="all">All Owners</MenuItem>
                      <MenuItem value="selected">Selected Owners</MenuItem>
                    </TextField>
                    {form.vendorRestrictionType === 'selected' &&
                      renderMultiSelect(
                        'businessIds',
                        'Select Owners',
                        serviceOwners.map((o) => ({
                          id: o.business._id,
                          label: `${o.business.name} (${o.owner.firstName} ${o.owner.lastName})`,
                        })),
                      )}
                  </>
                )}

                <TextField
                  select
                  label="Location Restrictions"
                  value={form.locationRestrictionType}
                  onChange={(e) => {
                    const value = e.target.value as typeof form.locationRestrictionType;
                    updateForm('locationRestrictionType', value);
                    if (value !== 'cities') updateForm('cityNames', '');
                    if (value !== 'areas') updateForm('areaNames', '');
                    clearFieldError('cityNames');
                    clearFieldError('areaNames');
                  }}
                  fullWidth
                >
                  <MenuItem value="all">All Cities</MenuItem>
                  <MenuItem value="cities">Selected Cities</MenuItem>
                  <MenuItem value="areas">Selected Areas</MenuItem>
                </TextField>
                {form.locationRestrictionType === 'cities' && (
                  <TextField
                    label="Cities (comma-separated)"
                    value={form.cityNames}
                    onChange={(e) => updateForm('cityNames', e.target.value)}
                    fullWidth
                    placeholder="Indore, Bhopal, Dubai"
                    {...fieldProps('cityNames')}
                  />
                )}
                {form.locationRestrictionType === 'areas' && (
                  <TextField
                    label="Areas (comma-separated)"
                    value={form.areaNames}
                    onChange={(e) => updateForm('areaNames', e.target.value)}
                    fullWidth
                    {...fieldProps('areaNames')}
                  />
                )}
              </>
            )}

            <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
