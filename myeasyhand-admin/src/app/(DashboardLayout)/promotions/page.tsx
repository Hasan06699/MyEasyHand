'use client';

import { useRef, useState } from 'react';
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
  DialogContent,
  TextField,
  Stack,
  MenuItem,
  IconButton,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { IconTrash, IconEdit, IconEye, IconCheck, IconX } from '@tabler/icons-react';
import {
  promotionApi,
  PromotionBannerItem,
  ServiceRowItem,
  PromotionLimitsUsage,
  ServiceRowBackground,
  ServiceRowBackgroundType,
  BannerType,
  BannerTextPosition,
  ServiceRowSourceType,
  PromotionLocation,
  PromotionPlatform,
  PromotionStatus,
  PromotionApprovalStatus,
  categoryApi,
  serviceApi,
  couponApi,
  mediaApi,
  serviceOwnerApi,
  getApiErrorMessage,
  CategoryItem,
  getCategoryParentId,
  orderCategoriesHierarchically,
} from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import DialogHeader from '@/components/shared/DialogHeader';
import ServiceRowPreview from '@/components/promotions/ServiceRowPreview';
import BannerPreview from '@/components/promotions/BannerPreview';
import HtmlEditor from '@/components/promotions/HtmlEditor';
import {
  emptySpacingByViewport,
  normalizeSpacingByViewport,
  DEFAULT_MARGIN,
  DEFAULT_PADDING,
} from '@/components/promotions/serviceRowSpacing';
import { useAuthStore } from '@/stores/auth.store';
import { parseApiValidationError } from '@/lib/apiErrors';

const BANNER_FIELD_LABELS: Record<string, string> = {
  name: 'Promotion Name',
  status: 'Status',
  startDate: 'Start Date',
  endDate: 'End Date',
  priorityOrder: 'Priority Order',
  bannerImageWeb: 'Banner Image (Web)',
  bannerImageMobile: 'Banner Image (Mobile)',
  bannerTitle: 'Banner Title',
  bannerSubtitle: 'Banner Subtitle',
  bannerType: 'Banner Type',
  showImageOnly: 'Show Image Only',
  textPosition: 'Text Position',
  linkUrl: 'Link URL',
  htmlContent: 'HTML Content',
  couponId: 'Active Coupon',
  serviceSourceType: 'Service Source',
  categoryId: 'Category',
  subcategoryId: 'Subcategory',
  serviceIds: 'Services',
  maxItems: 'Max Items',
  platforms: 'Platforms',
  locations: 'Locations',
  customerTargetType: 'Customer Target',
};

const ROW_FIELD_LABELS: Record<string, string> = {
  rowName: 'Row Name',
  rowTitle: 'Row Title',
  rowSubtitle: 'Row Subtitle',
  serviceSourceType: 'Service Source',
  categoryId: 'Category',
  subcategoryId: 'Subcategory',
  serviceIds: 'Services',
  maxItems: 'Max Items',
  startDate: 'Start Date',
  endDate: 'End Date',
};

function ValidationErrorAlert({
  message,
  fieldErrors,
  fieldLabels = {},
}: {
  message: string;
  fieldErrors: Record<string, string>;
  fieldLabels?: Record<string, string>;
}) {
  const entries = Object.entries(fieldErrors);
  if (!message && entries.length === 0) return null;

  return (
    <Alert severity="error">
      {message && <AlertTitle>{message}</AlertTitle>}
      {entries.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {entries.map(([field, msg]) => (
            <Typography component="li" variant="body2" key={field}>
              {fieldLabels[field] ?? field}: {msg}
            </Typography>
          ))}
        </Box>
      )}
    </Alert>
  );
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  draft: 'default',
  inactive: 'warning',
};

const APPROVAL_COLORS: Record<PromotionApprovalStatus, 'success' | 'warning' | 'error' | 'default'> = {
  draft: 'default',
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

const OWNER_BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'services', label: 'Services' },
  { value: 'coupon', label: 'Coupon' },
];

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  ...OWNER_BANNER_TYPES,
  { value: 'link', label: 'Link' },
  { value: 'html', label: 'HTML Page' },
];

const TEXT_POSITIONS: { value: BannerTextPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center-left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

function normalizeTextPosition(position?: string): BannerTextPosition {
  if (position === 'left') return 'center-left';
  if (position === 'right') return 'center-right';
  if (TEXT_POSITIONS.some((p) => p.value === position)) {
    return position as BannerTextPosition;
  }
  return 'center-left';
}

function textPositionFlex(position: BannerTextPosition) {
  const map: Record<BannerTextPosition, { justifyContent: string; alignItems: string }> = {
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
    'top-center': { justifyContent: 'center', alignItems: 'flex-start' },
    'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
    'center-left': { justifyContent: 'flex-start', alignItems: 'center' },
    center: { justifyContent: 'center', alignItems: 'center' },
    'center-right': { justifyContent: 'flex-end', alignItems: 'center' },
    'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end' },
    'bottom-center': { justifyContent: 'center', alignItems: 'flex-end' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' },
  };
  return map[position];
}

function resolveBannerTypeFromItem(banner: PromotionBannerItem): BannerType {
  if (banner.bannerType) return banner.bannerType;
  if (banner.bannerLayoutType === 'html_landing') return 'html';
  if (banner.couponId) return 'coupon';
  if (banner.linkUrl || banner.redirectionUrl || banner.ctaButtonLink) return 'link';
  return 'services';
}

const emptyBannerForm = {
  name: '',
  status: 'draft' as const,
  startDate: '',
  endDate: '',
  priorityOrder: 0,
  bannerImageWeb: '',
  bannerImageMobile: '',
  bannerTitle: '',
  bannerSubtitle: '',
  bannerType: 'services' as BannerType,
  showImageOnly: false,
  textPosition: 'center-left' as BannerTextPosition,
  linkUrl: '',
  htmlContent: '',
  serviceSourceType: 'featured' as ServiceRowSourceType,
  categoryId: '',
  subcategoryId: '',
  serviceIds: [] as string[],
  couponId: '',
  maxItems: 10,
  platforms: ['mobile_app', 'website'] as PromotionPlatform[],
  locations: ['home'] as PromotionLocation[],
  customerTargetType: 'all' as const,
};

const SERVICE_ROW_SOURCES: { value: ServiceRowSourceType; label: string }[] = [
  { value: 'category', label: 'Category Based' },
  { value: 'subcategory', label: 'Subcategory Based' },
  { value: 'selected_services', label: 'Selected Services' },
  { value: 'featured', label: 'Featured Services' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'new_services', label: 'New Services' },
];

const PLATFORMS: { value: PromotionPlatform; label: string }[] = [
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'website', label: 'Website' },
  { value: 'owner_dashboard', label: 'Owner Dashboard' },
];

const LOCATIONS: { value: PromotionLocation; label: string }[] = [
  { value: 'home', label: 'Home Page' },
  { value: 'category', label: 'Category Page' },
  { value: 'search', label: 'Search Page' },
  { value: 'service_details', label: 'Service Details' },
  { value: 'campaign', label: 'Campaign Page' },
];

function toDateInput(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getPromotionOwnerLabel(item: {
  isPlatformPromotion?: boolean;
  ownerName?: string | null;
  businessName?: string | null;
}) {
  if (item.isPlatformPromotion) return 'Platform';
  if (item.ownerName && item.businessName) {
    return `${item.ownerName} (${item.businessName})`;
  }
  return item.ownerName || item.businessName || 'Owner';
}

function toDateTimeInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const BACKGROUND_TYPES: { value: ServiceRowBackgroundType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'color', label: 'Solid Color' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video (max 10 MB)' },
];

const MAX_BG_VIDEO_BYTES = 10 * 1024 * 1024;

function toIdList(ids?: Array<string | { _id: string }>): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => (typeof id === 'string' ? id : id._id));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const emptyRowForm = {
  rowName: '',
  displayOrder: 0,
  status: 'draft' as PromotionStatus,
  startDate: '',
  endDate: '',
  background: {
    type: 'none' as ServiceRowBackgroundType,
    color: '#ffffff',
    gradientStart: '#31c1ca',
    gradientEnd: '#1e88e5',
    gradientAngle: 90,
    imageUrl: '',
    imageUrlWeb: '',
    imageUrlMobile: '',
    videoSource: 'upload' as const,
    videoUrl: '',
    youtubeUrl: '',
    videoAutoplay: true,
    videoMuted: true,
  } as ServiceRowBackground,
  rowMargin: emptySpacingByViewport(DEFAULT_MARGIN),
  rowPadding: emptySpacingByViewport(DEFAULT_PADDING),
  rowTitle: '',
  rowSubtitle: '',
  serviceSourceType: 'featured' as ServiceRowSourceType,
  categoryId: '',
  subcategoryId: '',
  serviceIds: [] as string[],
  maxItems: 10,
  platforms: ['mobile_app', 'website'] as PromotionPlatform[],
  locations: ['home'] as PromotionLocation[],
  customerTargetType: 'all' as const,
};

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin') ?? false;
  const canManage =
    isSuperAdmin || user?.roleSlugs?.includes('business_owner');
  const availableBannerTypes = isSuperAdmin ? BANNER_TYPES : OWNER_BANNER_TYPES;

  const [mainTab, setMainTab] = useState(0);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [rowOpen, setRowOpen] = useState(false);
  const [bannerPreviewOpen, setBannerPreviewOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<PromotionBannerItem | null>(null);
  const [showBannerFormPreview, setShowBannerFormPreview] = useState(false);
  const [rowPreviewOpen, setRowPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState<ServiceRowItem | null>(null);
  const [showRowFormPreview, setShowRowFormPreview] = useState(true);
  const [editingBanner, setEditingBanner] = useState<PromotionBannerItem | null>(null);
  const [editingRow, setEditingRow] = useState<ServiceRowItem | null>(null);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const [rowForm, setRowForm] = useState(emptyRowForm);
  const [error, setError] = useState('');
  const [bannerFieldErrors, setBannerFieldErrors] = useState<Record<string, string>>({});
  const [rowFieldErrors, setRowFieldErrors] = useState<Record<string, string>>({});
  const [uploadingWeb, setUploadingWeb] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingBgImageWeb, setUploadingBgImageWeb] = useState(false);
  const [uploadingBgImageMobile, setUploadingBgImageMobile] = useState(false);
  const [uploadingBgVideo, setUploadingBgVideo] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'web' | 'mobile'>('web');
  const [ownerFilter, setOwnerFilter] = useState('');
  const webImageRef = useRef<HTMLInputElement>(null);
  const mobileImageRef = useRef<HTMLInputElement>(null);
  const bgImageWebRef = useRef<HTMLInputElement>(null);
  const bgImageMobileRef = useRef<HTMLInputElement>(null);
  const bgVideoRef = useRef<HTMLInputElement>(null);

  const promotionListParams = isSuperAdmin
    ? ownerFilter === 'platform'
      ? { scope: 'platform' as const }
      : ownerFilter
        ? { ownerId: ownerFilter }
        : undefined
    : undefined;

  const { data: serviceOwners = [] } = useQuery({
    queryKey: ['service-owners-for-promotions'],
    queryFn: async () => (await serviceOwnerApi.list()).data.data,
    enabled: isSuperAdmin,
  });

  const { data: bannersRes, isLoading: bannersLoading } = useQuery({
    queryKey: ['promotions', 'banners', promotionListParams],
    queryFn: () => promotionApi.listBanners(promotionListParams),
  });

  const { data: rowsRes, isLoading: rowsLoading } = useQuery({
    queryKey: ['promotions', 'service-rows', promotionListParams],
    queryFn: () => promotionApi.listServiceRows(promotionListParams),
  });

  const { data: statsRes } = useQuery({
    queryKey: ['promotions', 'stats'],
    queryFn: () => promotionApi.stats(),
    enabled: mainTab === 2,
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list({ includeInactive: true }),
  });

  const { data: servicesRes } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list(),
  });

  const { data: couponsRes } = useQuery({
    queryKey: ['coupons', 'active'],
    queryFn: () => couponApi.list({ status: 'active' }),
    enabled: bannerOpen,
  });

  const categories = orderCategoriesHierarchically(categoriesRes?.data?.data ?? []);
  const parentCategories = categories.filter((c) => !getCategoryParentId(c));
  const subcategories = (parentId: string) =>
    categories.filter((c) => getCategoryParentId(c) === parentId);
  const services = servicesRes?.data?.data ?? [];
  const activeCoupons = (couponsRes?.data?.data ?? []).filter(
    (c) => (c.effectiveStatus ?? c.status) === 'active',
  );
  const banners = bannersRes?.data?.data ?? [];
  const serviceRows = rowsRes?.data?.data ?? [];
  const promotionLimits = (bannersRes?.data?.meta?.limits ??
    rowsRes?.data?.meta?.limits) as PromotionLimitsUsage | undefined;
  const canCreateBanner = isSuperAdmin || promotionLimits?.canCreateBanner === true;
  const canCreateServiceRow = isSuperAdmin || promotionLimits?.canCreateServiceRow === true;
  const canEditBannerItem = (banner: PromotionBannerItem) => isSuperAdmin || banner.canEdit === true;
  const canEditServiceRowItem = (row: ServiceRowItem) => isSuperAdmin || row.canEdit === true;
  const stats = statsRes?.data?.data;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
  };

  const bannerMutation = useMutation({
    mutationFn: (data: Partial<PromotionBannerItem>) =>
      editingBanner
        ? promotionApi.updateBanner(editingBanner._id, data)
        : promotionApi.createBanner(data),
    onSuccess: () => {
      invalidateAll();
      setBannerOpen(false);
      setEditingBanner(null);
      setBannerForm(emptyBannerForm);
      setError('');
      setBannerFieldErrors({});
    },
    onError: (err: unknown) => {
      const { message, fieldErrors } = parseApiValidationError(err, 'Failed to save banner');
      setError(message);
      setBannerFieldErrors(fieldErrors);
    },
  });

  const rowMutation = useMutation({
    mutationFn: (data: Partial<ServiceRowItem>) =>
      editingRow
        ? promotionApi.updateServiceRow(editingRow._id, data)
        : promotionApi.createServiceRow(data),
    onSuccess: () => {
      invalidateAll();
      setRowOpen(false);
      setEditingRow(null);
      setRowForm(emptyRowForm);
      setError('');
      setRowFieldErrors({});
    },
    onError: (err: unknown) => {
      const { message, fieldErrors } = parseApiValidationError(err, 'Failed to save service row');
      setError(message);
      setRowFieldErrors(fieldErrors);
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => promotionApi.deleteBanner(id),
    onSuccess: invalidateAll,
  });

  const deleteRowMutation = useMutation({
    mutationFn: (id: string) => promotionApi.deleteServiceRow(id),
    onSuccess: invalidateAll,
  });

  const approveBannerMutation = useMutation({
    mutationFn: (id: string) => promotionApi.approveBanner(id),
    onSuccess: invalidateAll,
  });

  const rejectBannerMutation = useMutation({
    mutationFn: (id: string) => promotionApi.rejectBanner(id),
    onSuccess: invalidateAll,
  });

  const approveRowMutation = useMutation({
    mutationFn: (id: string) => promotionApi.approveServiceRow(id),
    onSuccess: invalidateAll,
  });

  const rejectRowMutation = useMutation({
    mutationFn: (id: string) => promotionApi.rejectServiceRow(id),
    onSuccess: invalidateAll,
  });

  const submitBannerReviewMutation = useMutation({
    mutationFn: (id: string) => promotionApi.submitBanner(id),
    onSuccess: invalidateAll,
  });

  const submitRowReviewMutation = useMutation({
    mutationFn: (id: string) => promotionApi.submitServiceRow(id),
    onSuccess: invalidateAll,
  });

  const clearBannerFieldError = (field: string) => {
    if (bannerFieldErrors[field]) {
      setBannerFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const bannerFieldProps = (field: string, helperText?: string) => ({
    error: !!bannerFieldErrors[field],
    helperText: bannerFieldErrors[field] || helperText,
  });

  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm(emptyBannerForm);
    setError('');
    setBannerFieldErrors({});
    setShowBannerFormPreview(false);
    setBannerOpen(true);
  };

  const openEditBanner = (banner: PromotionBannerItem) => {
    setEditingBanner(banner);
    setBannerForm({
      name: banner.name,
      status: banner.status,
      startDate: toDateInput(banner.startDate),
      endDate: toDateInput(banner.endDate),
      priorityOrder: banner.priorityOrder,
      bannerImageWeb: banner.bannerImageWeb,
      bannerImageMobile: banner.bannerImageMobile ?? '',
      bannerTitle: banner.bannerTitle ?? '',
      bannerSubtitle: banner.bannerSubtitle ?? '',
      bannerType: resolveBannerTypeFromItem(banner),
      showImageOnly: banner.showImageOnly ?? false,
      textPosition: normalizeTextPosition(banner.textPosition),
      linkUrl: banner.linkUrl ?? banner.redirectionUrl ?? banner.ctaButtonLink ?? '',
      htmlContent: banner.htmlContent ?? '',
      serviceSourceType: banner.serviceSourceType ?? 'featured',
      categoryId: typeof banner.categoryId === 'object' ? banner.categoryId._id : banner.categoryId ?? '',
      subcategoryId:
        typeof banner.subcategoryId === 'object' ? banner.subcategoryId._id : banner.subcategoryId ?? '',
      serviceIds: toIdList(banner.serviceIds),
      couponId:
        typeof banner.couponId === 'object' ? banner.couponId._id : banner.couponId ?? '',
      maxItems: banner.maxItems ?? 10,
      platforms: banner.platforms,
      locations: banner.locations,
      customerTargetType: banner.customerTargetType,
    });
    setError('');
    setBannerFieldErrors({});
    setShowBannerFormPreview(false);
    setBannerOpen(true);
  };

  const openBannerPreview = (banner: PromotionBannerItem) => {
    setPreviewBanner(banner);
    setBannerPreviewOpen(true);
  };

  const getPreviewServicesForBanner = (banner: {
    bannerType?: BannerType;
    serviceSourceType?: ServiceRowSourceType;
    serviceIds?: string[] | Array<string | { _id: string }>;
    maxItems?: number;
  }) => {
    const type = banner.bannerType ?? 'services';
    if (type !== 'services') return [];
    if (banner.serviceSourceType === 'selected_services') {
      const ids = toIdList(banner.serviceIds);
      if (ids.length) {
        return services.filter((s) => ids.includes(s._id)).slice(0, banner.maxItems ?? 6);
      }
    }
    return [];
  };

  const bannerFormPreviewServices = getPreviewServicesForBanner(bannerForm);

  const openCreateRow = () => {
    setEditingRow(null);
    setRowForm(emptyRowForm);
    setError('');
    setRowFieldErrors({});
    setShowRowFormPreview(true);
    setRowOpen(true);
  };

  const openEditRow = (row: ServiceRowItem) => {
    setEditingRow(row);
    setRowForm({
      rowName: row.rowName,
      displayOrder: row.displayOrder,
      status: row.status ?? (row.isActive ? 'active' : 'inactive'),
      startDate: toDateTimeInput(row.startDate),
      endDate: toDateTimeInput(row.endDate),
      background: {
        type: row.background?.type ?? 'none',
        color: row.background?.color ?? '#ffffff',
        gradientStart: row.background?.gradientStart ?? '#31c1ca',
        gradientEnd: row.background?.gradientEnd ?? '#1e88e5',
        gradientAngle: row.background?.gradientAngle ?? 90,
        imageUrl: row.background?.imageUrl ?? '',
        imageUrlWeb: row.background?.imageUrlWeb ?? row.background?.imageUrl ?? '',
        imageUrlMobile: row.background?.imageUrlMobile ?? row.background?.imageUrl ?? '',
        videoSource: row.background?.videoSource ?? 'upload',
        videoUrl: row.background?.videoUrl ?? '',
        youtubeUrl: row.background?.youtubeUrl ?? '',
        videoAutoplay: row.background?.videoAutoplay !== false,
        videoMuted: row.background?.videoMuted !== false,
      },
      rowMargin: normalizeSpacingByViewport(row.rowMargin, DEFAULT_MARGIN),
      rowPadding: normalizeSpacingByViewport(row.rowPadding, DEFAULT_PADDING),
      rowTitle: row.rowTitle,
      rowSubtitle: row.rowSubtitle ?? '',
      serviceSourceType: row.serviceSourceType,
      categoryId: typeof row.categoryId === 'object' ? row.categoryId._id : row.categoryId ?? '',
      subcategoryId:
        typeof row.subcategoryId === 'object' ? row.subcategoryId._id : row.subcategoryId ?? '',
      serviceIds: toIdList(row.serviceIds),
      maxItems: row.maxItems,
      platforms: row.platforms,
      locations: row.locations,
      customerTargetType: row.customerTargetType,
    });
    setError('');
    setRowFieldErrors({});
    setShowRowFormPreview(true);
    setRowOpen(true);
  };

  const openRowPreview = (row: ServiceRowItem) => {
    setPreviewRow(row);
    setRowPreviewOpen(true);
  };

  const getPreviewServicesForRow = (row: {
    serviceSourceType: ServiceRowSourceType;
    serviceIds?: string[];
    maxItems?: number;
  }) => {
    if (row.serviceSourceType === 'selected_services' && row.serviceIds?.length) {
      return services.filter((s) => row.serviceIds!.includes(s._id)).slice(0, row.maxItems ?? 6);
    }
    return [];
  };

  const rowFormPreviewServices = getPreviewServicesForRow(rowForm);

  const handleBannerImageUpload = async (file: File, field: 'bannerImageWeb' | 'bannerImageMobile') => {
    const setUploading = field === 'bannerImageWeb' ? setUploadingWeb : setUploadingMobile;
    setUploading(true);
    try {
      const res = await mediaApi.uploadServiceImage(file);
      setBannerForm((f) => ({ ...f, [field]: res.data.data?.url ?? '' }));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const buildBannerPayload = (): Partial<PromotionBannerItem> => ({
    ...bannerForm,
    startDate: bannerForm.startDate ? new Date(`${bannerForm.startDate}T00:00:00.000Z`).toISOString() : '',
    endDate: bannerForm.endDate ? new Date(`${bannerForm.endDate}T23:59:59.999Z`).toISOString() : '',
    priorityOrder: Number(bannerForm.priorityOrder),
    maxItems: Number(bannerForm.maxItems),
    textPosition: normalizeTextPosition(bannerForm.textPosition),
    categoryId: bannerForm.categoryId || undefined,
    subcategoryId: bannerForm.subcategoryId || undefined,
    linkUrl: bannerForm.bannerType === 'link' ? bannerForm.linkUrl : undefined,
    htmlContent: bannerForm.bannerType === 'html' ? bannerForm.htmlContent : undefined,
    serviceSourceType: bannerForm.bannerType === 'services' ? bannerForm.serviceSourceType : undefined,
    couponId: bannerForm.bannerType === 'coupon' ? bannerForm.couponId || undefined : undefined,
    bannerLayoutType: bannerForm.bannerType === 'html' ? 'html_landing' : 'standard',
  });

  const submitBanner = () => {
    if (bannerForm.bannerType === 'coupon' && !bannerForm.couponId) {
      setError('Please select an active coupon');
      setBannerFieldErrors({ couponId: 'Please select an active coupon' });
      return;
    }
    const payload = buildBannerPayload();
    setError('');
    setBannerFieldErrors({});
    bannerMutation.mutate(payload);
  };

  const submitBannerForReview = async () => {
    if (bannerForm.bannerType === 'coupon' && !bannerForm.couponId) {
      setError('Please select an active coupon');
      setBannerFieldErrors({ couponId: 'Please select an active coupon' });
      return;
    }
    const payload = buildBannerPayload();
    setError('');
    setBannerFieldErrors({});
    try {
      let id = editingBanner?._id;
      if (!id) {
        const res = await promotionApi.createBanner(payload);
        id = res.data.data._id;
      } else {
        await promotionApi.updateBanner(id, payload);
      }
      await promotionApi.submitBanner(id);
      invalidateAll();
      setBannerOpen(false);
      setEditingBanner(null);
      setBannerForm(emptyBannerForm);
    } catch (err: unknown) {
      const { message, fieldErrors } = parseApiValidationError(err, 'Failed to submit banner for review');
      setError(message);
      setBannerFieldErrors(fieldErrors);
    }
  };

  const handleBackgroundImageUpload = async (file: File, target: 'web' | 'mobile') => {
    const setUploading = target === 'web' ? setUploadingBgImageWeb : setUploadingBgImageMobile;
    setUploading(true);
    try {
      const res = await mediaApi.uploadPromotionBackgroundImage(file);
      const url = res.data.data?.url ?? '';
      setRowForm((f) => ({
        ...f,
        background: {
          ...f.background,
          type: 'image',
          ...(target === 'web' ? { imageUrlWeb: url } : { imageUrlMobile: url }),
        },
      }));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, `Failed to upload ${target} background image`));
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundVideoUpload = async (file: File) => {
    if (file.size > MAX_BG_VIDEO_BYTES) {
      setError('Video must not exceed 10 MB');
      return;
    }
    setUploadingBgVideo(true);
    try {
      const res = await mediaApi.uploadPromotionBackgroundVideo(file);
      setRowForm((f) => ({
        ...f,
        background: {
          ...f.background,
          type: 'video',
          videoSource: 'upload',
          videoUrl: res.data.data?.url ?? '',
        },
      }));
    } catch {
      setError('Failed to upload background video');
    } finally {
      setUploadingBgVideo(false);
    }
  };

  const buildRowPayload = (): Partial<ServiceRowItem> => ({
    ...rowForm,
    displayOrder: Number(rowForm.displayOrder),
    maxItems: Number(rowForm.maxItems),
    categoryId: rowForm.categoryId || undefined,
    subcategoryId: rowForm.subcategoryId || undefined,
    startDate: rowForm.startDate ? new Date(rowForm.startDate).toISOString() : undefined,
    endDate: rowForm.endDate ? new Date(rowForm.endDate).toISOString() : undefined,
    background: rowForm.background,
    rowMargin: rowForm.rowMargin,
    rowPadding: rowForm.rowPadding,
  });

  const submitRow = () => {
    rowMutation.mutate(buildRowPayload());
  };

  const submitRowForReview = async () => {
    const payload = buildRowPayload();
    setError('');
    setRowFieldErrors({});
    try {
      let id = editingRow?._id;
      if (!id) {
        const res = await promotionApi.createServiceRow(payload);
        id = res.data.data._id;
      } else {
        await promotionApi.updateServiceRow(id, payload);
      }
      await promotionApi.submitServiceRow(id);
      invalidateAll();
      setRowOpen(false);
      setEditingRow(null);
      setRowForm(emptyRowForm);
    } catch (err: unknown) {
      const { message, fieldErrors } = parseApiValidationError(err, 'Failed to submit service row for review');
      setError(message);
      setRowFieldErrors(fieldErrors);
    }
  };

  const renderBannerServiceSourceFields = () => (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          select
          label="Service Source"
          value={bannerForm.serviceSourceType}
          onChange={(e) => {
            clearBannerFieldError('serviceSourceType');
            setBannerForm((f) => ({
              ...f,
              serviceSourceType: e.target.value as ServiceRowSourceType,
            }));
          }}
          fullWidth
          {...bannerFieldProps('serviceSourceType')}
        >
          {SERVICE_ROW_SOURCES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Max Items"
          type="number"
          value={bannerForm.maxItems}
          onChange={(e) => setBannerForm((f) => ({ ...f, maxItems: Number(e.target.value) }))}
          fullWidth
        />
      </Stack>

      {bannerForm.serviceSourceType === 'category' && (
        <TextField
          select
          label="Category"
          value={bannerForm.categoryId}
          onChange={(e) => {
            clearBannerFieldError('categoryId');
            setBannerForm((f) => ({ ...f, categoryId: e.target.value }));
          }}
          fullWidth
          {...bannerFieldProps('categoryId')}
        >
          {parentCategories.map((c: CategoryItem) => (
            <MenuItem key={c._id} value={c._id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      {bannerForm.serviceSourceType === 'subcategory' && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Category"
            value={bannerForm.categoryId}
            onChange={(e) =>
              setBannerForm((f) => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))
            }
            fullWidth
          >
            {parentCategories.map((c: CategoryItem) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Subcategory"
            value={bannerForm.subcategoryId}
            onChange={(e) => setBannerForm((f) => ({ ...f, subcategoryId: e.target.value }))}
            fullWidth
            disabled={!bannerForm.categoryId}
          >
            {subcategories(bannerForm.categoryId).map((c: CategoryItem) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {bannerForm.serviceSourceType === 'selected_services' && (
        <FormControl fullWidth size="small">
          <InputLabel>Services</InputLabel>
          <Select
            multiple
            value={bannerForm.serviceIds}
            onChange={(e) => setBannerForm((f) => ({ ...f, serviceIds: e.target.value as string[] }))}
            input={<OutlinedInput label="Services" />}
            renderValue={(selected) =>
              services
                .filter((s) => selected.includes(s._id))
                .map((s) => s.name)
                .join(', ')
            }
          >
            {services.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                <Checkbox checked={bannerForm.serviceIds.includes(s._id)} />
                <ListItemText primary={s.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );

  const renderSpacingFields = (
    label: string,
    field: 'rowMargin' | 'rowPadding',
  ) => (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        {label} (px)
      </Typography>
      {(['web', 'mobile'] as const).map((platform) => (
        <Box key={`${field}-${platform}`}>
          <Typography variant="body2" sx={{ mb: 1, textTransform: 'capitalize' }}>
            {platform}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <TextField
                key={`${field}-${platform}-${side}`}
                label={side.charAt(0).toUpperCase() + side.slice(1)}
                type="number"
                value={rowForm[field][platform][side]}
                onChange={(e) =>
                  setRowForm((f) => ({
                    ...f,
                    [field]: {
                      ...f[field],
                      [platform]: {
                        ...f[field][platform],
                        [side]: Number(e.target.value),
                      },
                    },
                  }))
                }
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
                size="small"
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );

  const renderMultiSelect = (
    label: string,
    value: string[],
    options: { value: string; label: string }[],
    onChange: (val: string[]) => void,
  ) => (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(e) => onChange(e.target.value as string[])}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) =>
          options
            .filter((o) => selected.includes(o.value))
            .map((o) => o.label)
            .join(', ')
        }
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            <Checkbox checked={value.includes(o.value)} />
            <ListItemText primary={o.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Promotion Management</Typography>
      </Stack>

      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3 }}>
        <Tab label="Banner Promotions" />
        <Tab label="Service Rows" />
        <Tab label="Analytics" />
      </Tabs>

      {canManage && !isSuperAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You can manage only your own promotions within your plan limits
          {promotionLimits
            ? ` (${promotionLimits.bannerCount}/${promotionLimits.maxBanners} banners, ${promotionLimits.serviceRowCount}/${promotionLimits.maxServiceRows} service rows).`
            : '.'}{' '}
          Save changes as a draft, then submit for admin review when ready. Banner types: services and
          coupon only.
        </Alert>
      )}

      {isSuperAdmin && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            select
            label="Filter by owner"
            size="small"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            sx={{ minWidth: 280 }}
          >
            <MenuItem value="">All promotions</MenuItem>
            <MenuItem value="platform">Platform only</MenuItem>
            {serviceOwners.map((owner) => (
              <MenuItem key={owner._id} value={owner._id}>
                {owner.owner.firstName} {owner.owner.lastName} — {owner.business.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {mainTab === 0 && (
        <DashboardCard
          title="Banner Promotions"
          action={
            canManage && canCreateBanner ? (
              <Button variant="contained" onClick={openCreateBanner}>
                Create Banner
              </Button>
            ) : undefined
          }
        >
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  {isSuperAdmin && <TableCell>Owner</TableCell>}
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Approval</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Clicks</TableCell>
                  <TableCell>Dates</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {bannersLoading ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 11 : 10}>Loading...</TableCell>
                  </TableRow>
                ) : banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 11 : 10}>No banners yet</TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow key={banner._id}>
                      <TableCell>{banner.name}</TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <Typography variant="body2">{getPromotionOwnerLabel(banner)}</Typography>
                        </TableCell>
                      )}
                      <TableCell>{banner.bannerTitle ?? '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={resolveBannerTypeFromItem(banner)} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={banner.effectiveStatus ?? banner.status}
                          color={STATUS_COLORS[banner.effectiveStatus ?? banner.status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={banner.approvalStatus ?? 'approved'}
                          color={APPROVAL_COLORS[banner.approvalStatus ?? 'approved']}
                        />
                      </TableCell>
                      <TableCell>{banner.priorityOrder}</TableCell>
                      <TableCell>{banner.viewCount}</TableCell>
                      <TableCell>{banner.clickCount}</TableCell>
                      <TableCell>
                        {toDateInput(banner.startDate)} – {toDateInput(banner.endDate)}
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openBannerPreview(banner)} title="Preview">
                            <IconEye size={18} />
                          </IconButton>
                          {isSuperAdmin && banner.approvalStatus === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                title="Approve"
                                onClick={() => approveBannerMutation.mutate(banner._id)}
                              >
                                <IconCheck size={18} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                title="Reject"
                                onClick={() => rejectBannerMutation.mutate(banner._id)}
                              >
                                <IconX size={18} />
                              </IconButton>
                            </>
                          )}
                          {canEditBannerItem(banner) && (
                            <>
                              <IconButton size="small" onClick={() => openEditBanner(banner)}>
                                <IconEdit size={18} />
                              </IconButton>
                              {banner.canSubmit && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                  onClick={() => submitBannerReviewMutation.mutate(banner._id)}
                                  disabled={submitBannerReviewMutation.isPending}
                                >
                                  Submit
                                </Button>
                              )}
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteBannerMutation.mutate(banner._id)}
                              >
                                <IconTrash size={18} />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </DashboardCard>
      )}

      {mainTab === 1 && (
        <DashboardCard
          title="Service Rows / Collections"
          action={
            canManage && canCreateServiceRow ? (
              <Button variant="contained" onClick={openCreateRow}>
                Create Service Row
              </Button>
            ) : undefined
          }
        >
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Row Name</TableCell>
                  {isSuperAdmin && <TableCell>Owner</TableCell>}
                  <TableCell>Title</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Approval</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Clicks</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rowsLoading ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 11 : 10}>Loading...</TableCell>
                  </TableRow>
                ) : serviceRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 11 : 10}>No service rows yet</TableCell>
                  </TableRow>
                ) : (
                  serviceRows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.rowName}</TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <Typography variant="body2">{getPromotionOwnerLabel(row)}</Typography>
                        </TableCell>
                      )}
                      <TableCell>{row.rowTitle}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.serviceSourceType.replace(/_/g, ' ')} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.effectiveStatus ?? row.status ?? (row.isActive ? 'active' : 'inactive')}
                          color={
                            STATUS_COLORS[row.effectiveStatus ?? row.status ?? (row.isActive ? 'active' : 'inactive')] ??
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.approvalStatus ?? 'approved'}
                          color={APPROVAL_COLORS[row.approvalStatus ?? 'approved']}
                        />
                      </TableCell>
                      <TableCell>
                        {row.startDate || row.endDate
                          ? `${row.startDate ? toDateTimeInput(row.startDate).replace('T', ' ') : '—'} – ${row.endDate ? toDateTimeInput(row.endDate).replace('T', ' ') : '—'}`
                          : '—'}
                      </TableCell>
                      <TableCell>{row.displayOrder}</TableCell>
                      <TableCell>{row.viewCount}</TableCell>
                      <TableCell>{row.clickCount}</TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openRowPreview(row)} title="Preview">
                            <IconEye size={18} />
                          </IconButton>
                          {isSuperAdmin && row.approvalStatus === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                title="Approve"
                                onClick={() => approveRowMutation.mutate(row._id)}
                              >
                                <IconCheck size={18} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                title="Reject"
                                onClick={() => rejectRowMutation.mutate(row._id)}
                              >
                                <IconX size={18} />
                              </IconButton>
                            </>
                          )}
                          {canEditServiceRowItem(row) && (
                            <>
                              <IconButton size="small" onClick={() => openEditRow(row)}>
                                <IconEdit size={18} />
                              </IconButton>
                              {row.canSubmit && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                  onClick={() => submitRowReviewMutation.mutate(row._id)}
                                  disabled={submitRowReviewMutation.isPending}
                                >
                                  Submit
                                </Button>
                              )}
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteRowMutation.mutate(row._id)}
                              >
                                <IconTrash size={18} />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </DashboardCard>
      )}

      {mainTab === 2 && stats && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              { label: 'Active Banners', value: stats.activeBanners },
              { label: 'Active Service Rows', value: stats.activeServiceRows },
              { label: 'Total Views', value: stats.totalViews },
              { label: 'Total Clicks', value: stats.totalClicks },
              { label: 'CTR', value: `${stats.clickThroughRate}%` },
              { label: 'Conversions', value: stats.bookingConversions },
              { label: 'Revenue', value: formatCurrency(stats.revenueGenerated) },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5">{item.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DashboardCard title="Most Clicked Banners">
                <Stack spacing={1}>
                  {stats.topBanners.map((b) => (
                    <Stack key={b._id} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2">{b.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {b.clickCount} clicks / {b.viewCount} views
                      </Typography>
                    </Stack>
                  ))}
                  {!stats.topBanners.length && (
                    <Typography variant="body2" color="text.secondary">
                      No data yet
                    </Typography>
                  )}
                </Stack>
              </DashboardCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DashboardCard title="Most Clicked Service Rows">
                <Stack spacing={1}>
                  {stats.topServiceRows.map((r) => (
                    <Stack key={r._id} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2">{r.rowName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.clickCount} clicks / {r.viewCount} views
                      </Typography>
                    </Stack>
                  ))}
                  {!stats.topServiceRows.length && (
                    <Typography variant="body2" color="text.secondary">
                      No data yet
                    </Typography>
                  )}
                </Stack>
              </DashboardCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Banner Dialog */}
      <Dialog open={bannerOpen} onClose={() => setBannerOpen(false)} maxWidth="lg" fullWidth>
        <DialogHeader
          title={editingBanner ? 'Edit Banner' : 'Create Banner'}
          onClose={() => setBannerOpen(false)}
          actions={
            <Button size="small" onClick={() => setShowBannerFormPreview((v) => !v)}>
              {showBannerFormPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          }
        />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ValidationErrorAlert
              message={error}
              fieldErrors={bannerFieldErrors}
              fieldLabels={BANNER_FIELD_LABELS}
            />

            {showBannerFormPreview && (
              <BannerPreview
                data={{
                  bannerTitle: bannerForm.bannerTitle,
                  bannerSubtitle: bannerForm.bannerSubtitle,
                  bannerImageWeb: bannerForm.bannerImageWeb,
                  bannerImageMobile: bannerForm.bannerImageMobile,
                  bannerType: bannerForm.bannerType,
                  showImageOnly: bannerForm.showImageOnly,
                  textPosition: normalizeTextPosition(bannerForm.textPosition),
                  linkUrl: bannerForm.linkUrl,
                  htmlContent: bannerForm.htmlContent,
                  couponCode: activeCoupons.find((c) => c._id === bannerForm.couponId)?.code,
                  maxItems: bannerForm.maxItems,
                }}
                services={bannerFormPreviewServices}
                viewport={previewViewport}
                onViewportChange={setPreviewViewport}
              />
            )}

            <TextField
              label="Promotion Name"
              value={bannerForm.name}
              onChange={(e) => {
                clearBannerFieldError('name');
                setBannerForm((f) => ({ ...f, name: e.target.value }));
              }}
              fullWidth
              required
              {...bannerFieldProps('name')}
            />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ width: '100%', alignItems: { md: 'flex-start' } }}
            >
              <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      select
                      label="Status"
                      value={bannerForm.status}
                      onChange={(e) => setBannerForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
                      fullWidth
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Banner Type"
                      value={bannerForm.bannerType}
                      onChange={(e) =>
                        setBannerForm((f) => ({ ...f, bannerType: e.target.value as BannerType }))
                      }
                      fullWidth
                    >
                      {availableBannerTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                    <Box sx={{ flex: 1, width: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={bannerForm.showImageOnly}
                            onChange={(e) =>
                              setBannerForm((f) => ({ ...f, showImageOnly: e.target.checked }))
                            }
                          />
                        }
                        label="Show image only"
                      />
                    </Box>
                    <TextField
                      label="Priority Order"
                      type="number"
                      value={bannerForm.priorityOrder}
                      onChange={(e) => setBannerForm((f) => ({ ...f, priorityOrder: Number(e.target.value) }))}
                      fullWidth
                      sx={{ flex: 1 }}
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={bannerForm.startDate}
                      onChange={(e) => {
                        clearBannerFieldError('startDate');
                        setBannerForm((f) => ({ ...f, startDate: e.target.value }));
                      }}
                      slotProps={{ inputLabel: { shrink: true } }}
                      fullWidth
                      required
                      {...bannerFieldProps('startDate')}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={bannerForm.endDate}
                      onChange={(e) => {
                        clearBannerFieldError('endDate');
                        setBannerForm((f) => ({ ...f, endDate: e.target.value }));
                      }}
                      slotProps={{ inputLabel: { shrink: true } }}
                      fullWidth
                      required
                      {...bannerFieldProps('endDate')}
                    />
                  </Stack>
                </Stack>
              </Box>

              <Box
                sx={{
                  width: { xs: '100%', md: 200 },
                  flexShrink: 0,
                  opacity: bannerForm.showImageOnly ? 0.5 : 1,
                  pointerEvents: bannerForm.showImageOnly ? 'none' : 'auto',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Text Position
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 0.75,
                    width: '100%',
                    maxWidth: 180,
                  }}
                >
                  {TEXT_POSITIONS.map((p) => {
                    const selected = bannerForm.textPosition === p.value;
                    const flex = textPositionFlex(p.value);
                    return (
                      <Box
                        key={p.value}
                        onClick={() => setBannerForm((f) => ({ ...f, textPosition: p.value }))}
                        title={p.label}
                        sx={{
                          height: 36,
                          borderRadius: 1,
                          border: '2px solid',
                          borderColor: selected ? 'primary.main' : 'divider',
                          bgcolor: selected ? 'primary.light' : 'action.hover',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: flex.justifyContent,
                          alignItems: flex.alignItems,
                          p: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: selected ? 'primary.main' : 'text.disabled',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  {TEXT_POSITIONS.find((p) => p.value === bannerForm.textPosition)?.label ?? 'Center Left'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, width: '100%' }}>
                <TextField
                  label="Banner Image (Web)"
                  value={bannerForm.bannerImageWeb}
                  onChange={(e) => {
                    clearBannerFieldError('bannerImageWeb');
                    setBannerForm((f) => ({ ...f, bannerImageWeb: e.target.value }));
                  }}
                  fullWidth
                  required
                  {...bannerFieldProps('bannerImageWeb')}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                  <input
                    ref={webImageRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerImageUpload(file, 'bannerImageWeb');
                    }}
                  />
                  <Button variant="outlined" size="small" onClick={() => webImageRef.current?.click()} disabled={uploadingWeb}>
                    {uploadingWeb ? 'Uploading...' : 'Upload'}
                  </Button>
                  {bannerForm.bannerImageWeb ? (
                    <Box
                      component="img"
                      src={bannerForm.bannerImageWeb}
                      alt="Web banner preview"
                      sx={{
                        height: 40,
                        width: 80,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ) : null}
                </Stack>
              </Box>
              <Box sx={{ flex: 1, width: '100%' }}>
                <TextField
                  label="Banner Image (Mobile)"
                  value={bannerForm.bannerImageMobile}
                  onChange={(e) => setBannerForm((f) => ({ ...f, bannerImageMobile: e.target.value }))}
                  fullWidth
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                  <input
                    ref={mobileImageRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerImageUpload(file, 'bannerImageMobile');
                    }}
                  />
                  <Button variant="outlined" size="small" onClick={() => mobileImageRef.current?.click()} disabled={uploadingMobile}>
                    {uploadingMobile ? 'Uploading...' : 'Upload'}
                  </Button>
                  {bannerForm.bannerImageMobile ? (
                    <Box
                      component="img"
                      src={bannerForm.bannerImageMobile}
                      alt="Mobile banner preview"
                      sx={{
                        height: 40,
                        width: 40,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ) : null}
                </Stack>
              </Box>
            </Stack>

            <TextField
              label="Banner Title"
              value={bannerForm.bannerTitle}
              onChange={(e) => setBannerForm((f) => ({ ...f, bannerTitle: e.target.value }))}
              fullWidth
              disabled={bannerForm.showImageOnly}
              helperText={bannerForm.showImageOnly ? 'Hidden when image-only mode is enabled' : undefined}
            />
            <TextField
              label="Banner Subtitle"
              value={bannerForm.bannerSubtitle}
              onChange={(e) => setBannerForm((f) => ({ ...f, bannerSubtitle: e.target.value }))}
              fullWidth
              disabled={bannerForm.showImageOnly}
              helperText={bannerForm.showImageOnly ? 'Hidden when image-only mode is enabled' : undefined}
            />

            {bannerForm.bannerType === 'services' && renderBannerServiceSourceFields()}

            {bannerForm.bannerType === 'link' && (
              <TextField
                label="Link URL"
                placeholder="https://example.com"
                value={bannerForm.linkUrl}
                onChange={(e) => {
                  clearBannerFieldError('linkUrl');
                  setBannerForm((f) => ({ ...f, linkUrl: e.target.value }));
                }}
                fullWidth
                required
                {...bannerFieldProps('linkUrl', 'Opens when the banner is clicked')}
              />
            )}

            {bannerForm.bannerType === 'html' && (
              <HtmlEditor
                value={bannerForm.htmlContent}
                onChange={(html) => setBannerForm((f) => ({ ...f, htmlContent: html }))}
                helperText="Full HTML page shown when the banner is opened"
              />
            )}

            {bannerForm.bannerType === 'coupon' && (
              <TextField
                select
                label="Active Coupon"
                value={bannerForm.couponId}
                onChange={(e) => {
                  clearBannerFieldError('couponId');
                  setBannerForm((f) => ({ ...f, couponId: e.target.value }));
                }}
                fullWidth
                required
                {...bannerFieldProps('couponId', 'Customers can copy this coupon code from the banner')}
              >
                {activeCoupons.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active coupons available
                  </MenuItem>
                ) : (
                  activeCoupons.map((coupon) => (
                    <MenuItem key={coupon._id} value={coupon._id}>
                      {coupon.code} — {coupon.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}

            {renderMultiSelect(
              'Platforms',
              bannerForm.platforms,
              PLATFORMS,
              (val) => setBannerForm((f) => ({ ...f, platforms: val as PromotionPlatform[] })),
            )}
            {renderMultiSelect(
              'Locations',
              bannerForm.locations,
              LOCATIONS,
              (val) => setBannerForm((f) => ({ ...f, locations: val as PromotionLocation[] })),
            )}

            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button onClick={() => setBannerOpen(false)}>Cancel</Button>
              <Button variant="outlined" onClick={() => setShowBannerFormPreview(true)}>
                Preview
              </Button>
              {isSuperAdmin ? (
                <Button variant="contained" onClick={submitBanner} disabled={bannerMutation.isPending}>
                  {bannerMutation.isPending ? 'Saving...' : 'Save Banner'}
                </Button>
              ) : (
                <>
                  <Button variant="outlined" onClick={submitBanner} disabled={bannerMutation.isPending}>
                    {bannerMutation.isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="contained" onClick={submitBannerForReview} disabled={bannerMutation.isPending}>
                    Submit for Review
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Banner Preview Dialog */}
      <Dialog open={bannerPreviewOpen} onClose={() => setBannerPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogHeader
          title={`Banner Preview — ${previewBanner?.name ?? ''}`}
          onClose={() => setBannerPreviewOpen(false)}
        />
        <DialogContent>
          {previewBanner && (
            <Box sx={{ mt: 1 }}>
              <BannerPreview
                data={{
                  bannerTitle: previewBanner.bannerTitle,
                  bannerSubtitle: previewBanner.bannerSubtitle,
                  bannerImageWeb: previewBanner.bannerImageWeb,
                  bannerImageMobile: previewBanner.bannerImageMobile,
                  bannerType: resolveBannerTypeFromItem(previewBanner),
                  showImageOnly: previewBanner.showImageOnly ?? false,
                  textPosition: normalizeTextPosition(previewBanner.textPosition),
                  linkUrl: previewBanner.linkUrl ?? previewBanner.redirectionUrl ?? previewBanner.ctaButtonLink,
                  htmlContent: previewBanner.htmlContent,
                  couponCode:
                    typeof previewBanner.couponId === 'object' ? previewBanner.couponId.code : undefined,
                  maxItems: previewBanner.maxItems,
                }}
                services={getPreviewServicesForBanner({
                  bannerType: resolveBannerTypeFromItem(previewBanner),
                  serviceSourceType: previewBanner.serviceSourceType,
                  serviceIds: previewBanner.serviceIds,
                  maxItems: previewBanner.maxItems,
                })}
                viewport={previewViewport}
                onViewportChange={setPreviewViewport}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`Status: ${previewBanner.effectiveStatus ?? previewBanner.status ?? '—'}`}
                />
                <Chip size="small" label={resolveBannerTypeFromItem(previewBanner)} variant="outlined" />
                {previewBanner.serviceSourceType && (
                  <Chip
                    size="small"
                    label={previewBanner.serviceSourceType.replace(/_/g, ' ')}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          )}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setBannerPreviewOpen(false)}>Close</Button>
            {previewBanner && canManage && (
              <Button
                variant="contained"
                onClick={() => {
                  setBannerPreviewOpen(false);
                  openEditBanner(previewBanner);
                }}
              >
                Edit Banner
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Service Row Dialog */}
      <Dialog open={rowOpen} onClose={() => setRowOpen(false)} maxWidth="md" fullWidth>
        <DialogHeader
          title={editingRow ? 'Edit Service Row' : 'Create Service Row'}
          onClose={() => setRowOpen(false)}
          actions={
            <Button size="small" onClick={() => setShowRowFormPreview((v) => !v)}>
              {showRowFormPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          }
        />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ValidationErrorAlert
              message={error}
              fieldErrors={rowFieldErrors}
              fieldLabels={ROW_FIELD_LABELS}
            />

            {showRowFormPreview && (
              <ServiceRowPreview
                data={{
                  rowTitle: rowForm.rowTitle,
                  rowSubtitle: rowForm.rowSubtitle,
                  background: rowForm.background,
                  rowMargin: rowForm.rowMargin,
                  rowPadding: rowForm.rowPadding,
                  maxItems: rowForm.maxItems,
                }}
                services={rowFormPreviewServices}
                viewport={previewViewport}
                onViewportChange={setPreviewViewport}
              />
            )}

            <TextField
              label="Row Name (internal)"
              value={rowForm.rowName}
              onChange={(e) => setRowForm((f) => ({ ...f, rowName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Row Title (displayed)"
              value={rowForm.rowTitle}
              onChange={(e) => setRowForm((f) => ({ ...f, rowTitle: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Row Subtitle"
              value={rowForm.rowSubtitle}
              onChange={(e) => setRowForm((f) => ({ ...f, rowSubtitle: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Status"
                value={rowForm.status}
                onChange={(e) =>
                  setRowForm((f) => ({ ...f, status: e.target.value as PromotionStatus }))
                }
                fullWidth
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <TextField
                label="Start Date & Time"
                type="datetime-local"
                value={rowForm.startDate}
                onChange={(e) => setRowForm((f) => ({ ...f, startDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                label="End Date & Time"
                type="datetime-local"
                value={rowForm.endDate}
                onChange={(e) => setRowForm((f) => ({ ...f, endDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Stack>

            <Typography variant="subtitle2" color="text.secondary">
              Row Background
            </Typography>
            <TextField
              select
              label="Background Type"
              value={rowForm.background.type}
              onChange={(e) =>
                setRowForm((f) => ({
                  ...f,
                  background: { ...f.background, type: e.target.value as ServiceRowBackgroundType },
                }))
              }
              fullWidth
              size="small"
            >
              {BACKGROUND_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            {rowForm.background.type === 'color' && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Typography variant="body2">Color</Typography>
                <input
                  type="color"
                  value={rowForm.background.color ?? '#ffffff'}
                  onChange={(e) =>
                    setRowForm((f) => ({
                      ...f,
                      background: { ...f.background, color: e.target.value },
                    }))
                  }
                />
                <TextField
                  label="Hex"
                  value={rowForm.background.color ?? ''}
                  onChange={(e) =>
                    setRowForm((f) => ({
                      ...f,
                      background: { ...f.background, color: e.target.value },
                    }))
                  }
                  size="small"
                  sx={{ maxWidth: 140 }}
                />
              </Stack>
            )}

            {rowForm.background.type === 'gradient' && (
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2">Start</Typography>
                  <input
                    type="color"
                    value={rowForm.background.gradientStart ?? '#31c1ca'}
                    onChange={(e) =>
                      setRowForm((f) => ({
                        ...f,
                        background: { ...f.background, gradientStart: e.target.value },
                      }))
                    }
                  />
                  <Typography variant="body2">End</Typography>
                  <input
                    type="color"
                    value={rowForm.background.gradientEnd ?? '#1e88e5'}
                    onChange={(e) =>
                      setRowForm((f) => ({
                        ...f,
                        background: { ...f.background, gradientEnd: e.target.value },
                      }))
                    }
                  />
                </Stack>
                <TextField
                  label="Gradient Angle (degrees)"
                  type="number"
                  value={rowForm.background.gradientAngle ?? 90}
                  onChange={(e) =>
                    setRowForm((f) => ({
                      ...f,
                      background: { ...f.background, gradientAngle: Number(e.target.value) },
                    }))
                  }
                  slotProps={{ htmlInput: { min: 0, max: 360 } }}
                  fullWidth
                  size="small"
                />
              </Stack>
            )}

            {rowForm.background.type === 'image' && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Upload separate images for web and mobile
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                  <TextField
                    label="Web Image URL"
                    value={rowForm.background.imageUrlWeb ?? ''}
                    onChange={(e) =>
                      setRowForm((f) => ({
                        ...f,
                        background: { ...f.background, imageUrlWeb: e.target.value },
                      }))
                    }
                    fullWidth
                    size="small"
                  />
                  <input
                    ref={bgImageWebRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBackgroundImageUpload(file, 'web');
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => bgImageWebRef.current?.click()}
                    disabled={uploadingBgImageWeb}
                  >
                    {uploadingBgImageWeb ? 'Uploading...' : 'Upload Web'}
                  </Button>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                  <TextField
                    label="Mobile Image URL"
                    value={rowForm.background.imageUrlMobile ?? ''}
                    onChange={(e) =>
                      setRowForm((f) => ({
                        ...f,
                        background: { ...f.background, imageUrlMobile: e.target.value },
                      }))
                    }
                    fullWidth
                    size="small"
                  />
                  <input
                    ref={bgImageMobileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBackgroundImageUpload(file, 'mobile');
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => bgImageMobileRef.current?.click()}
                    disabled={uploadingBgImageMobile}
                  >
                    {uploadingBgImageMobile ? 'Uploading...' : 'Upload Mobile'}
                  </Button>
                </Stack>
              </Stack>
            )}

            {rowForm.background.type === 'video' && (
              <Stack spacing={2}>
                <TextField
                  select
                  label="Video Source"
                  value={rowForm.background.videoSource ?? 'upload'}
                  onChange={(e) =>
                    setRowForm((f) => ({
                      ...f,
                      background: {
                        ...f.background,
                        videoSource: e.target.value as 'upload' | 'youtube',
                      },
                    }))
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="upload">Upload Video (max 10 MB)</MenuItem>
                  <MenuItem value="youtube">YouTube URL</MenuItem>
                </TextField>

                {rowForm.background.videoSource === 'youtube' ? (
                  <TextField
                    label="YouTube URL"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={rowForm.background.youtubeUrl ?? ''}
                    onChange={(e) =>
                      setRowForm((f) => ({
                        ...f,
                        background: { ...f.background, youtubeUrl: e.target.value },
                      }))
                    }
                    fullWidth
                    size="small"
                  />
                ) : (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                    <TextField
                      label="Uploaded Video URL"
                      value={rowForm.background.videoUrl ?? ''}
                      onChange={(e) =>
                        setRowForm((f) => ({
                          ...f,
                          background: { ...f.background, videoUrl: e.target.value },
                        }))
                      }
                      fullWidth
                      size="small"
                    />
                    <input
                      ref={bgVideoRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBackgroundVideoUpload(file);
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => bgVideoRef.current?.click()}
                      disabled={uploadingBgVideo}
                    >
                      {uploadingBgVideo ? 'Uploading...' : 'Upload Video'}
                    </Button>
                  </Stack>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rowForm.background.videoAutoplay !== false}
                        onChange={(e) =>
                          setRowForm((f) => ({
                            ...f,
                            background: { ...f.background, videoAutoplay: e.target.checked },
                          }))
                        }
                      />
                    }
                    label="Autoplay"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rowForm.background.videoMuted === false}
                        onChange={(e) =>
                          setRowForm((f) => ({
                            ...f,
                            background: { ...f.background, videoMuted: !e.target.checked },
                          }))
                        }
                      />
                    }
                    label="Sound on"
                  />
                </Stack>
              </Stack>
            )}

            {renderSpacingFields('Row Margin', 'rowMargin')}
            {renderSpacingFields('Row Padding', 'rowPadding')}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Service Source"
                value={rowForm.serviceSourceType}
                onChange={(e) =>
                  setRowForm((f) => ({ ...f, serviceSourceType: e.target.value as ServiceRowSourceType }))
                }
                fullWidth
              >
                {SERVICE_ROW_SOURCES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Display Order"
                type="number"
                value={rowForm.displayOrder}
                onChange={(e) => setRowForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Max Items"
                type="number"
                value={rowForm.maxItems}
                onChange={(e) => setRowForm((f) => ({ ...f, maxItems: Number(e.target.value) }))}
                fullWidth
              />
            </Stack>

            {rowForm.serviceSourceType === 'category' && (
              <TextField
                select
                label="Category"
                value={rowForm.categoryId}
                onChange={(e) => setRowForm((f) => ({ ...f, categoryId: e.target.value }))}
                fullWidth
              >
                {parentCategories.map((c: CategoryItem) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {rowForm.serviceSourceType === 'subcategory' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Category"
                  value={rowForm.categoryId}
                  onChange={(e) =>
                    setRowForm((f) => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))
                  }
                  fullWidth
                >
                  {parentCategories.map((c: CategoryItem) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Subcategory"
                  value={rowForm.subcategoryId}
                  onChange={(e) => setRowForm((f) => ({ ...f, subcategoryId: e.target.value }))}
                  fullWidth
                  disabled={!rowForm.categoryId}
                >
                  {subcategories(rowForm.categoryId).map((c: CategoryItem) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            )}

            {rowForm.serviceSourceType === 'selected_services' && (
              <FormControl fullWidth size="small">
                <InputLabel>Services</InputLabel>
                <Select
                  multiple
                  value={rowForm.serviceIds}
                  onChange={(e) => setRowForm((f) => ({ ...f, serviceIds: e.target.value as string[] }))}
                  input={<OutlinedInput label="Services" />}
                  renderValue={(selected) =>
                    services
                      .filter((s) => selected.includes(s._id))
                      .map((s) => s.name)
                      .join(', ')
                  }
                >
                  {services.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      <Checkbox checked={rowForm.serviceIds.includes(s._id)} />
                      <ListItemText primary={s.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {renderMultiSelect(
              'Platforms',
              rowForm.platforms,
              PLATFORMS,
              (val) => setRowForm((f) => ({ ...f, platforms: val as PromotionPlatform[] })),
            )}
            {renderMultiSelect(
              'Locations',
              rowForm.locations,
              LOCATIONS,
              (val) => setRowForm((f) => ({ ...f, locations: val as PromotionLocation[] })),
            )}

            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button onClick={() => setRowOpen(false)}>Cancel</Button>
              <Button variant="outlined" onClick={() => setShowRowFormPreview(true)}>
                Preview
              </Button>
              {isSuperAdmin ? (
                <Button variant="contained" onClick={submitRow} disabled={rowMutation.isPending}>
                  {rowMutation.isPending ? 'Saving...' : 'Save Service Row'}
                </Button>
              ) : (
                <>
                  <Button variant="outlined" onClick={submitRow} disabled={rowMutation.isPending}>
                    {rowMutation.isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="contained" onClick={submitRowForReview} disabled={rowMutation.isPending}>
                    Submit for Review
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Service Row Preview Dialog */}
      <Dialog open={rowPreviewOpen} onClose={() => setRowPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogHeader
          title={`Service Row Preview — ${previewRow?.rowName ?? ''}`}
          onClose={() => setRowPreviewOpen(false)}
        />
        <DialogContent>
          {previewRow && (
            <Box sx={{ mt: 1 }}>
              <ServiceRowPreview
                data={{
                  rowTitle: previewRow.rowTitle,
                  rowSubtitle: previewRow.rowSubtitle,
                  background: previewRow.background ?? { type: 'none' },
                  rowMargin: normalizeSpacingByViewport(previewRow.rowMargin, DEFAULT_MARGIN),
                  rowPadding: normalizeSpacingByViewport(previewRow.rowPadding, DEFAULT_PADDING),
                  maxItems: previewRow.maxItems,
                }}
                services={getPreviewServicesForRow({
                  serviceSourceType: previewRow.serviceSourceType,
                  serviceIds: toIdList(previewRow.serviceIds),
                  maxItems: previewRow.maxItems,
                })}
                viewport={previewViewport}
                onViewportChange={setPreviewViewport}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                <Chip size="small" label={`Status: ${previewRow.effectiveStatus ?? previewRow.status ?? '—'}`} />
                <Chip size="small" label={previewRow.serviceSourceType.replace(/_/g, ' ')} variant="outlined" />
              </Stack>
            </Box>
          )}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setRowPreviewOpen(false)}>Close</Button>
            {previewRow && canManage && (
              <Button
                variant="contained"
                onClick={() => {
                  setRowPreviewOpen(false);
                  openEditRow(previewRow);
                }}
              >
                Edit Row
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
