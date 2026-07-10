'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Avatar,
  Divider,
  Grid,
  Tooltip,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { IconTrash, IconEdit, IconPhoto, IconStar, IconFlame, IconCheck, IconX } from '@tabler/icons-react';
import {
  serviceApi,
  featureRequestApi,
  mediaApi,
  serviceOwnerApi,
  cityApi,
  ServiceItem,
  ServiceFormData,
  ServiceGalleryItem,
  FeatureRequestItem,
  CityItem,
  DEFAULT_SERVICE_ICON,
  getCategoryParentId,
  orderCategoriesHierarchically,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import IconPicker from '@/components/services/IconPicker';
import { FieldHint, FieldMessage } from '@/components/services/FieldHint';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

type FormField = keyof ServiceFormData | 'image' | 'gallery' | 'submit';

const emptyForm: ServiceFormData = {
  businessId: '',
  name: '',
  slug: '',
  parentCategoryId: '',
  subCategoryId: '',
  cityIds: [],
  serviceCode: '',
  shortDescription: '',
  fullDescription: '',
  icon: '',
  image: '',
  mrp: '',
  salePrice: '',
  discountPercent: '',
  discountExpiresAt: '',
  basePrice: '',
  priceType: 'fixed',
  duration: '',
  durationUnit: 'minute',
  gstPercentage: '',
  status: 'pending',
  displayOrder: 0,
  metaTitle: '',
  metaKeywords: '',
  metaDescription: '',
};

const MAX_IMAGE_BYTES = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function statusColor(status: ServiceItem['status']): 'success' | 'default' | 'warning' | 'info' {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'draft') return 'info';
  return 'default';
}

function formatPrice(service: ServiceItem): string {
  if (service.priceType === 'quote-based') return 'Quote';
  const discountActive =
    service.salePrice != null &&
    service.mrp != null &&
    (!service.discountExpiresAt || new Date(service.discountExpiresAt) > new Date());
  if (discountActive) {
    return `₹${service.salePrice} (${service.discountPercent ?? 0}% off)`;
  }
  const price = service.salePrice ?? service.basePrice;
  if (price == null) return '—';
  const suffix = service.priceType === 'hourly' ? '/hr' : '';
  return `₹${price}${suffix}`;
}

function calcDiscountPercent(mrp: number, salePrice: number): number {
  if (!mrp || mrp <= 0 || salePrice >= mrp) return 0;
  return Math.round(((mrp - salePrice) / mrp) * 100);
}

function calcSalePriceFromDiscount(mrp: number, discountPercent: number): number {
  if (!mrp || mrp <= 0) return 0;
  const clamped = Math.min(100, Math.max(0, discountPercent));
  return Math.round(mrp * (1 - clamped / 100));
}

function formatDuration(service: ServiceItem): string {
  if (!service.duration) return '—';
  const unit = service.durationUnit ?? 'minute';
  const label = unit === 'minute' ? 'min' : unit === 'hour' ? 'hr' : 'day';
  return `${service.duration} ${label}`;
}

function getCategoryLabel(service: ServiceItem): string {
  const parent = service.parentCategoryId?.name;
  const sub = service.subCategoryId?.name;
  if (parent && sub) return `${parent} › ${sub}`;
  return parent || sub || '—';
}

function getOwnerName(service: ServiceItem): string {
  const owner = service.businessId?.ownerId;
  if (!owner) return '—';
  const name = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
  return name || owner.email || '—';
}

function serviceToForm(service: ServiceItem): ServiceFormData {
  return {
    businessId: service.businessId?._id ?? '',
    name: service.name,
    slug: service.slug,
    parentCategoryId: service.parentCategoryId?._id ?? '',
    subCategoryId: service.subCategoryId?._id ?? '',
    cityIds: (service.cityIds ?? []).map((c) => c._id),
    serviceCode: service.serviceCode ?? '',
    shortDescription: service.shortDescription,
    fullDescription: service.fullDescription ?? '',
    icon: service.icon && service.icon !== DEFAULT_SERVICE_ICON ? service.icon : '',
    image: service.image,
    mrp: service.mrp ?? '',
    salePrice: service.salePrice ?? '',
    discountPercent: service.discountPercent ?? '',
    discountExpiresAt: service.discountExpiresAt
      ? new Date(service.discountExpiresAt).toISOString().slice(0, 10)
      : '',
    basePrice: service.basePrice ?? '',
    priceType: service.priceType,
    duration: service.duration ?? '',
    durationUnit: service.durationUnit ?? 'minute',
    gstPercentage: service.gstPercentage ?? '',
    status: service.status,
    displayOrder: service.displayOrder,
    metaTitle: service.metaTitle ?? '',
    metaKeywords: service.metaKeywords ?? '',
    metaDescription: service.metaDescription ?? '',
  };
}

function formToPayload(form: ServiceFormData) {
  return {
    ...(form.businessId ? { businessId: form.businessId } : {}),
    name: form.name,
    slug: form.slug || undefined,
    parentCategoryId: form.parentCategoryId,
    subCategoryId: form.subCategoryId || null,
    cityIds: form.cityIds.length ? form.cityIds : undefined,
    serviceCode: form.serviceCode || undefined,
    shortDescription: form.shortDescription,
    fullDescription: form.fullDescription || undefined,
    icon: form.icon || undefined,
    image: form.image,
    mrp: form.mrp === '' ? undefined : Number(form.mrp),
    salePrice: form.salePrice === '' ? undefined : Number(form.salePrice),
    discountPercent: form.discountPercent === '' ? undefined : Number(form.discountPercent),
    discountExpiresAt: form.discountExpiresAt || undefined,
    basePrice:
      form.salePrice !== ''
        ? Number(form.salePrice)
        : form.basePrice === ''
          ? undefined
          : Number(form.basePrice),
    priceType: form.priceType,
    duration: form.duration === '' ? undefined : Number(form.duration),
    durationUnit: form.durationUnit || undefined,
    gstPercentage: form.gstPercentage === '' ? undefined : Number(form.gstPercentage),
    status: form.status,
    displayOrder: form.displayOrder,
    metaTitle: form.metaTitle || undefined,
    metaKeywords: form.metaKeywords || undefined,
    metaDescription: form.metaDescription || undefined,
  };
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, JPEG, PNG, and WEBP images are allowed';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must not exceed 1 MB';
  }
  return null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 1 }}>
      {children}
    </Typography>
  );
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');

  const [tab, setTab] = useState(0);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [gallery, setGallery] = useState<ServiceGalleryItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    const ownerId = searchParams.get('ownerId');
    if (ownerId) setOwnerFilter(ownerId);
  }, [searchParams]);

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services', ownerFilter],
    queryFn: async () => {
      const res = await serviceApi.list(1, {
        ownerId: ownerFilter || undefined,
      });
      return res.data.data;
    },
  });

  const { data: serviceOwners } = useQuery({
    queryKey: ['service-owners-for-filter'],
    queryFn: async () => {
      const res = await serviceOwnerApi.list();
      return res.data.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: featureRequests } = useQuery({
    queryKey: ['feature-requests', isSuperAdmin],
    queryFn: async () => {
      const res = await featureRequestApi.list(isSuperAdmin ? 'pending' : undefined);
      return res.data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await serviceApi.listCategories();
      return res.data.data;
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['admin-cities-active'],
    queryFn: async () => {
      const res = await cityApi.listAdmin(false);
      return res.data.data.filter((c) => c.isActive);
    },
  });

  const orderedCategories = categories ? orderCategoriesHierarchically(categories) : [];
  const parentCategories = orderedCategories.filter((c) => !getCategoryParentId(c));
  const subCategories = orderedCategories.filter((c) => getCategoryParentId(c) === form.parentCategoryId);
  const selectedCities = cities.filter((c) => form.cityIds.includes(c._id));

  const clearFieldError = (field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: FormField, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setGallery([]);
    setFieldErrors({});
    setSubmitError('');
    setOpen(true);
  };

  const openEdit = (service: ServiceItem) => {
    setEditing(service);
    setForm(serviceToForm(service));
    setGallery(service.gallery ?? []);
    setFieldErrors({});
    setSubmitError('');
    setOpen(true);
  };

  const updatePricing = (updates: Partial<ServiceFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      const mrp = next.mrp === '' ? 0 : Number(next.mrp);
      const sale = next.salePrice === '' ? 0 : Number(next.salePrice);
      const discount =
        next.discountPercent === '' ? null : Number(next.discountPercent);

      if ('discountPercent' in updates) {
        if (next.discountPercent === '' && mrp > 0) {
          next.salePrice = mrp;
        } else if (mrp > 0 && discount !== null && discount >= 0 && discount <= 100) {
          next.salePrice = calcSalePriceFromDiscount(mrp, discount);
        }
      } else if ('mrp' in updates && mrp > 0) {
        if (discount !== null && discount > 0 && discount <= 100) {
          next.salePrice = calcSalePriceFromDiscount(mrp, discount);
        } else if (sale > 0 && sale <= mrp) {
          next.discountPercent = calcDiscountPercent(mrp, sale);
        }
      } else if ('salePrice' in updates && mrp > 0 && sale > 0 && sale <= mrp) {
        next.discountPercent = calcDiscountPercent(mrp, sale);
      }

      return next;
    });
    Object.keys(updates).forEach((key) => clearFieldError(key as FormField));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<FormField, string>> = {};
    if (!form.name.trim()) errors.name = 'Service name is required';
    if (isSuperAdmin && !form.businessId) errors.businessId = 'Select a service owner';
    if (!form.parentCategoryId) errors.parentCategoryId = 'Select a parent category';
    if (!form.cityIds.length) errors.cityIds = 'Select at least one city where this service is available';
    if (!form.shortDescription.trim()) errors.shortDescription = 'Short description is required';
    if (!form.image) errors.image = 'Service image is required (square 1:1, max 1 MB)';
    if (!form.priceType) errors.priceType = 'Select a price type';
    if (form.priceType !== 'quote-based') {
      if (form.mrp !== '' && form.salePrice !== '' && Number(form.salePrice) > Number(form.mrp)) {
        errors.salePrice = 'Sale price cannot be higher than MRP';
      }
      if (form.discountPercent !== '' && Number(form.discountPercent) > 100) {
        errors.discountPercent = 'Discount cannot exceed 100%';
      }
      if (form.salePrice !== '' && form.discountExpiresAt) {
        const expiry = new Date(form.discountExpiresAt);
        if (Number.isNaN(expiry.getTime())) {
          errors.discountExpiresAt = 'Enter a valid expiry date';
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (editing) {
        return serviceApi.update(editing._id, payload);
      }
      const res = await serviceApi.create(payload);
      const serviceId = res.data.data._id;
      const tempGallery = gallery.filter((g) => g._id.startsWith('temp-'));
      await Promise.all(
        tempGallery.map((item, index) => serviceApi.addGalleryImage(serviceId, item.imagePath, index)),
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setGallery([]);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save service';
      if (message.toLowerCase().includes('service code')) {
        setFieldErrors({ serviceCode: message });
        setSubmitError('');
        return;
      }
      setSubmitError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
    onError: (err: unknown) => {
      setDeleteError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to delete service',
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => serviceApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const featureRequestMutation = useMutation({
    mutationFn: (data: { serviceId: string; requestType: 'featured' | 'popular' }) =>
      featureRequestApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feature-requests'] }),
  });

  const updateFlagMutation = useMutation({
    mutationFn: ({
      id,
      flag,
      enabled,
    }: {
      id: string;
      flag: 'featured' | 'popular';
      enabled: boolean;
    }) =>
      serviceApi.update(id, flag === 'featured' ? { isFeatured: enabled } : { isPopular: enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const reviewFeatureMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      action === 'approve' ? featureRequestApi.approve(id) : featureRequestApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const handleImageUpload = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setFieldError('image', validationError);
      return;
    }
    clearFieldError('image');
    try {
      setUploadingImage(true);
      const res = await mediaApi.uploadServiceImage(file);
      setForm((prev) => ({ ...prev, image: res.data.data.url }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Service image upload failed';
      setFieldError('image', message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setFieldError('gallery', validationError);
      return;
    }
    clearFieldError('gallery');
    try {
      setUploadingGallery(true);
      const res = await mediaApi.uploadServiceGallery(file);
      const imagePath = res.data.data.url;

      if (editing) {
        const galleryRes = await serviceApi.addGalleryImage(editing._id, imagePath, gallery.length);
        setGallery((prev) => [...prev, galleryRes.data.data]);
      } else {
        setGallery((prev) => [
          ...prev,
          {
            _id: `temp-${Date.now()}`,
            serviceId: '',
            imagePath,
            sortOrder: prev.length,
          },
        ]);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gallery upload failed';
      setFieldError('gallery', message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (item: ServiceGalleryItem) => {
    if (editing && !item._id.startsWith('temp-')) {
      await serviceApi.removeGalleryImage(editing._id, item._id);
    }
    setGallery((prev) => prev.filter((g) => g._id !== item._id));
  };

  const handleSave = () => {
    setSubmitError('');
    if (!validateForm()) return;
    saveMutation.mutate();
  };

  const isValid =
    form.name &&
    form.parentCategoryId &&
    form.shortDescription &&
    form.priceType &&
    form.image &&
    (!isSuperAdmin || form.businessId);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Services
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage catalog, media, and visibility requests
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>
          Add Service
        </Button>
      </Stack>

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError('')}>
          {deleteError}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Service Catalog" />
        {isSuperAdmin && (
          <Tab label={`Feature Requests${featureRequests?.length ? ` (${featureRequests.length})` : ''}`} />
        )}
      </Tabs>

      {tab === 0 && (
        <DashboardCard title="Service Catalog">
          {isSuperAdmin && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                select
                size="small"
                label="Filter by owner"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">All owners</MenuItem>
                {serviceOwners?.map((item) => (
                  <MenuItem key={item.owner._id} value={item.owner._id}>
                    {`${item.owner.firstName} ${item.owner.lastName}`.trim() || item.owner.email}
                    {item.business?.name ? ` (${item.business.name})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}
          {isLoading && <Typography>Loading...</Typography>}
          {services && (
            <Paper variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    {isSuperAdmin && <TableCell>Owner</TableCell>}
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 8 : 7} align="center">
                        No services yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((s) => (
                      <TableRow key={s._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Avatar src={s.image} variant="rounded" sx={{ width: 40, height: 40 }}>
                              <Icon icon={s.icon || DEFAULT_SERVICE_ICON} width={20} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {s.name}
                              </Typography>
                              {s.serviceCode && (
                                <Typography variant="caption" color="text.secondary">
                                  {s.serviceCode}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <Typography variant="body2">{getOwnerName(s)}</Typography>
                            {s.businessId?.name && (
                              <Typography variant="caption" color="text.secondary">
                                {s.businessId.name}
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>{getCategoryLabel(s)}</TableCell>
                        <TableCell>{formatPrice(s)}</TableCell>
                        <TableCell>{formatDuration(s)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                            {s.isFeatured ? (
                              <Chip
                                icon={<IconStar size={14} />}
                                label="Featured"
                                size="small"
                                color="warning"
                                variant="outlined"
                                onDelete={() => {
                                  if (confirm(`Remove Featured flag from "${s.name}"?`)) {
                                    updateFlagMutation.mutate({ id: s._id, flag: 'featured', enabled: false });
                                  }
                                }}
                              />
                            ) : isSuperAdmin ? (
                              <Tooltip title="Add Featured">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() =>
                                    updateFlagMutation.mutate({ id: s._id, flag: 'featured', enabled: true })
                                  }
                                >
                                  <IconStar size={16} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            {s.isPopular ? (
                              <Chip
                                icon={<IconFlame size={14} />}
                                label="Popular"
                                size="small"
                                color="error"
                                variant="outlined"
                                onDelete={() => {
                                  if (confirm(`Remove Popular flag from "${s.name}"?`)) {
                                    updateFlagMutation.mutate({ id: s._id, flag: 'popular', enabled: false });
                                  }
                                }}
                              />
                            ) : isSuperAdmin ? (
                              <Tooltip title="Add Popular">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    updateFlagMutation.mutate({ id: s._id, flag: 'popular', enabled: true })
                                  }
                                >
                                  <IconFlame size={16} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            {!isSuperAdmin && !s.isFeatured && !s.isPopular && (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip label={s.status} size="small" color={statusColor(s.status)} />
                        </TableCell>
                        <TableCell align="right">
                          {isSuperAdmin && s.status === 'pending' && (
                            <IconButton size="small" color="success" onClick={() => approveMutation.mutate(s._id)}>
                              <IconCheck size={18} />
                            </IconButton>
                          )}
                          {!isSuperAdmin && (
                            <>
                              {!s.isFeatured && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    featureRequestMutation.mutate({ serviceId: s._id, requestType: 'featured' })
                                  }
                                >
                                  <IconStar size={18} />
                                </IconButton>
                              )}
                              {!s.isPopular && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    featureRequestMutation.mutate({ serviceId: s._id, requestType: 'popular' })
                                  }
                                >
                                  <IconFlame size={18} />
                                </IconButton>
                              )}
                            </>
                          )}
                          <IconButton size="small" onClick={() => openEdit(s)}>
                            <IconEdit size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s._id);
                            }}
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
      )}

      {tab === 1 && isSuperAdmin && (
        <DashboardCard title="Pending Feature Requests">
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!featureRequests?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No pending requests
                    </TableCell>
                  </TableRow>
                ) : (
                  featureRequests.map((r: FeatureRequestItem) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.serviceId?.name}</TableCell>
                      <TableCell>
                        {r.ownerId?.firstName} {r.ownerId?.lastName}
                      </TableCell>
                      <TableCell>
                        <Chip label={r.requestType} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" color="warning" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => reviewFeatureMutation.mutate({ id: r._id, action: 'approve' })}
                        >
                          <IconCheck size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => reviewFeatureMutation.mutate({ id: r._id, action: 'reject' })}
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
        </DashboardCard>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            <SectionTitle>Basic Information</SectionTitle>
            <Grid container spacing={2}>
              {isSuperAdmin && (
                <Grid size={{ xs: 12 }}>
                  <FieldHint
                    label="Service Owner"
                    required
                    hint="Assign this service to a service owner and their business."
                  />
                  <TextField
                    select
                    fullWidth
                    required
                    value={form.businessId}
                    error={!!fieldErrors.businessId}
                    onChange={(e) => {
                      clearFieldError('businessId');
                      setForm({ ...form, businessId: e.target.value });
                    }}
                  >
                    <MenuItem value="">Select owner</MenuItem>
                    {serviceOwners?.map((item) => (
                      <MenuItem key={item.business._id} value={item.business._id}>
                        {`${item.owner.firstName} ${item.owner.lastName}`.trim() || item.owner.email}
                        {item.business?.name ? ` — ${item.business.name}` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                  <FieldMessage error={fieldErrors.businessId} />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 8 }}>
                <FieldHint
                  label="Service Name"
                  required
                  hint="Public name shown to customers in listings and booking."
                />
                <TextField
                  fullWidth
                  required
                  value={form.name}
                  error={!!fieldErrors.name}
                  onChange={(e) => {
                    clearFieldError('name');
                    setForm({ ...form, name: e.target.value });
                  }}
                />
                <FieldMessage error={fieldErrors.name} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint
                  label="Service Code"
                  hint="Optional. Leave blank to auto-generate (e.g. SVC-00001)."
                />
                <TextField
                  fullWidth
                  value={form.serviceCode}
                  error={!!fieldErrors.serviceCode}
                  onChange={(e) => {
                    clearFieldError('serviceCode');
                    setForm({ ...form, serviceCode: e.target.value });
                  }}
                  placeholder="Auto: SVC-00001"
                />
                <FieldMessage error={fieldErrors.serviceCode} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldHint label="Parent Category" required hint="Main category group for this service." />
                <TextField
                  select
                  fullWidth
                  required
                  value={form.parentCategoryId}
                  error={!!fieldErrors.parentCategoryId}
                  onChange={(e) => {
                    clearFieldError('parentCategoryId');
                    setForm({ ...form, parentCategoryId: e.target.value, subCategoryId: '' });
                  }}
                >
                  {parentCategories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <FieldMessage error={fieldErrors.parentCategoryId} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldHint label="Sub Category" hint="Optional sub-type under the parent category." />
                <TextField
                  select
                  fullWidth
                  value={form.subCategoryId}
                  onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })}
                  disabled={!form.parentCategoryId}
                >
                  <MenuItem value="">None</MenuItem>
                  {subCategories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldHint
                  label="Available Cities"
                  required
                  hint="Customers in these cities will see this service. Categories only appear if a service exists in the selected city."
                />
                <Autocomplete
                  multiple
                  options={cities}
                  value={selectedCities}
                  getOptionLabel={(option: CityItem) =>
                    option.state ? `${option.name}, ${option.state}` : option.name
                  }
                  isOptionEqualToValue={(a, b) => a._id === b._id}
                  onChange={(_, value) => {
                    clearFieldError('cityIds');
                    setForm({ ...form, cityIds: value.map((c) => c._id) });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={cities.length ? 'Select cities' : 'Add cities under Cities menu first'}
                      error={!!fieldErrors.cityIds}
                    />
                  )}
                />
                <FieldMessage error={fieldErrors.cityIds} />
              </Grid>
            </Grid>

            <Divider />
            <SectionTitle>Description</SectionTitle>
            <Box>
              <FieldHint
                label="Short Description"
                required
                hint="Brief summary (1–2 lines) shown in cards and search results."
              />
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                value={form.shortDescription}
                error={!!fieldErrors.shortDescription}
                onChange={(e) => {
                  clearFieldError('shortDescription');
                  setForm({ ...form, shortDescription: e.target.value });
                }}
              />
              <FieldMessage error={fieldErrors.shortDescription} />
            </Box>
            <Box>
              <FieldHint label="Full Description" hint="Detailed service description for the service detail page." />
              <TextField
                fullWidth
                multiline
                rows={3}
                value={form.fullDescription}
                onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
              />
            </Box>

            <Divider />
            <SectionTitle>Media</SectionTitle>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldHint label="Service Icon" hint="Visual icon from the library. Default icon is used if not selected." />
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm({ ...form, icon })}
                  error={fieldErrors.icon}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldHint
                  label="Service Image"
                  required
                  hint="Square image 512×512 px (1:1). Max 1 MB. Formats: JPG, JPEG, PNG, WEBP."
                />
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    src={form.image}
                    variant="rounded"
                    sx={{
                      width: 64,
                      height: 64,
                      border: fieldErrors.image ? '2px solid' : undefined,
                      borderColor: fieldErrors.image ? 'error.main' : undefined,
                    }}
                  >
                    <IconPhoto size={24} />
                  </Avatar>
                  <Button component="label" variant="outlined" disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : form.image ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </Button>
                </Stack>
                <FieldMessage
                  error={fieldErrors.image}
                  helper={!fieldErrors.image ? 'Required · 1:1 square · max 1 MB' : undefined}
                />
              </Grid>
              <Grid size={12}>
                <FieldHint
                  label="Gallery"
                  hint="Optional extra images. Recommended 900×500 px, max 1 MB each."
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                  {gallery.map((item) => (
                    <Box key={item._id} sx={{ position: 'relative' }}>
                      <Avatar src={item.imagePath} variant="rounded" sx={{ width: 72, height: 40 }} />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                        onClick={() => removeGalleryImage(item)}
                      >
                        <IconTrash size={14} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
                <Button component="label" variant="outlined" size="small" disabled={uploadingGallery}>
                  {uploadingGallery ? 'Uploading...' : 'Add Gallery Image'}
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGalleryUpload(file);
                      e.target.value = '';
                    }}
                  />
                </Button>
                <FieldMessage error={fieldErrors.gallery} />
              </Grid>
            </Grid>

            <Divider />
            <SectionTitle>Pricing & Offers</SectionTitle>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint
                  label="Price Type"
                  required
                  hint="Fixed one-time price, hourly rate, or quote-based (no fixed price)."
                />
                <TextField
                  select
                  fullWidth
                  required
                  value={form.priceType}
                  error={!!fieldErrors.priceType}
                  onChange={(e) => {
                    clearFieldError('priceType');
                    setForm({ ...form, priceType: e.target.value as ServiceFormData['priceType'] });
                  }}
                >
                  <MenuItem value="fixed">Fixed</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="quote-based">Quote-Based</MenuItem>
                </TextField>
                <FieldMessage error={fieldErrors.priceType} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="MRP (₹)" hint="Maximum retail price before discount. Shown as strikethrough when on sale." />
                <TextField
                  type="number"
                  fullWidth
                  value={form.mrp}
                  disabled={form.priceType === 'quote-based'}
                  onChange={(e) =>
                    updatePricing({ mrp: e.target.value === '' ? '' : +e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="Sale Price (₹)" hint="Discounted price customers pay during the offer period." />
                <TextField
                  type="number"
                  fullWidth
                  value={form.salePrice}
                  error={!!fieldErrors.salePrice}
                  disabled={form.priceType === 'quote-based'}
                  onChange={(e) =>
                    updatePricing({ salePrice: e.target.value === '' ? '' : +e.target.value })
                  }
                />
                <FieldMessage error={fieldErrors.salePrice} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="Discount %" hint="Updates sale price from MRP automatically. Changing sale price also updates this field." />
                <TextField
                  type="number"
                  fullWidth
                  value={form.discountPercent}
                  error={!!fieldErrors.discountPercent}
                  disabled={form.priceType === 'quote-based'}
                  onChange={(e) =>
                    updatePricing({
                      discountPercent: e.target.value === '' ? '' : +e.target.value,
                    })
                  }
                />
                <FieldMessage error={fieldErrors.discountPercent} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="Discount Expiry Date" hint="Offer ends after this date; MRP applies again." />
                <TextField
                  type="date"
                  fullWidth
                  value={form.discountExpiresAt}
                  error={!!fieldErrors.discountExpiresAt}
                  disabled={form.priceType === 'quote-based'}
                  onChange={(e) => {
                    clearFieldError('discountExpiresAt');
                    setForm({ ...form, discountExpiresAt: e.target.value });
                  }}
                />
                <FieldMessage error={fieldErrors.discountExpiresAt} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="GST %" hint="GST percentage applied on the final price." />
                <TextField
                  type="number"
                  fullWidth
                  value={form.gstPercentage}
                  onChange={(e) =>
                    setForm({ ...form, gstPercentage: e.target.value === '' ? '' : +e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Divider />
            <SectionTitle>Duration</SectionTitle>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="Duration" hint="Estimated time to complete the service." />
                <TextField
                  type="number"
                  fullWidth
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value === '' ? '' : +e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldHint label="Duration Unit" hint="Unit for the duration value." />
                <TextField
                  select
                  fullWidth
                  value={form.durationUnit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationUnit: e.target.value as ServiceFormData['durationUnit'],
                    })
                  }
                >
                  <MenuItem value="minute">Minute</MenuItem>
                  <MenuItem value="hour">Hour</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 1 }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!isValid || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
