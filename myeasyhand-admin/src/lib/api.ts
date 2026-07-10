import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5051/api/v1';
const AUTH_STORAGE_KEY = 'myeasyhand-auth';

let refreshPromise: Promise<string> | null = null;
let isRedirectingToLogin = false;

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectToLogin() {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  clearAuthStorage();
  window.location.href = '/authentication/login';
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const accessToken = data.data.accessToken as string;
  localStorage.setItem('accessToken', accessToken);
  return accessToken;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      typeof window === 'undefined' ||
      !originalRequest ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const accessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(originalRequest);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    roleSlugs: string[];
    businessId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  roleSlugs: string[];
  businessId?: string;
  status?: string;
  lastLoginAt?: string;
}

export type BusinessType =
  | 'individual'
  | 'proprietorship'
  | 'partnership'
  | 'llp'
  | 'private_limited'
  | 'other';

export type BusinessPublishStatus = 'draft' | 'published' | 'active' | 'inactive';

export interface BusinessHour {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export interface BusinessItem {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  banner?: string;
  businessType?: BusinessType;
  supportPhone?: string;
  whatsapp?: string;
  about?: string;
  companyOverview?: string;
  yearsOfExperience?: number;
  businessHours?: BusinessHour[];
  holidayNote?: string;
  emergencyServiceAvailable?: boolean;
  publishStatus?: BusinessPublishStatus;
  social?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  status: 'pending' | 'active' | 'suspended';
  ownerId: string;
}

export interface OwnerProfileData {
  _id: string;
  userId: string;
  displayName?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  username?: string;
  twoFactorEnabled: boolean;
  address?: {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    completeAddress?: string;
    postalCode?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };
  kycStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
  accountStatus: 'pending_verification' | 'active' | 'suspended' | 'blocked';
}

export interface OwnerPaymentInfo {
  _id: string;
  businessId: string;
  ownerId: string;
  bankAccount?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountType?: 'savings' | 'current';
  };
  upi?: { upiId?: string; qrCodeUrl?: string };
  payout?: {
    automaticSettlement?: boolean;
    manualWithdrawal?: boolean;
    settlementFrequency?: 'daily' | 'weekly' | 'monthly';
  };
  tax?: { gstNumber?: string; panNumber?: string; taxCertificateUrl?: string };
  bankVerificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
}

export interface ProfileCompletion {
  personal: number;
  business: number;
  payment: number;
  documents: number;
  overall: number;
}

export interface VerificationBadges {
  emailVerified: boolean;
  mobileVerified: boolean;
  kycVerified: boolean;
  gstVerified: boolean;
  businessVerified: boolean;
  premiumPartner: boolean;
}

export interface OwnerProfileOverview {
  user: UserProfile;
  profile: OwnerProfileData;
  business: BusinessItem | null;
  payment: OwnerPaymentInfo;
  completion: ProfileCompletion;
  badges: VerificationBadges;
  kycStatus: string;
  accountStatus: string;
  businessStatus?: string;
  publishStatus?: string;
}

export interface OwnerEarnings {
  totalEarnings: number;
  pendingPayments: number;
  withdrawableBalance: number;
  pendingBookingsCount: number;
  settlementHistory: Array<{
    _id: string;
    bookingNumber: string;
    paidAmount?: number;
    totalAmount: number;
    paymentStatus: string;
    updatedAt: string;
  }>;
}

export interface LoginActivity {
  lastLoginAt?: string;
  sessions: Array<{
    _id: string;
    deviceInfo?: { userAgent?: string; ip?: string };
    isRevoked: boolean;
    createdAt: string;
    expiresAt: string;
  }>;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  awaitingApproval: number;
  revenue: number;
}

export const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'employee_assigned',
  'employee_accepted',
  'visit_scheduled',
  'visit_started',
  'service_in_progress',
  'awaiting_customer_approval',
  'approved',
  'completed',
  'paid',
  'closed',
  'cancelled',
  'no_show',
  'rescheduled',
  'refunded',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface BookingItem {
  _id: string;
  bookingNumber: string;
  orderGroupId?: string;
  status: string;
  scheduledAt: string;
  visitScheduledAt?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus: string;
  notes?: string;
  customerId?: { firstName: string; lastName: string; email: string; phone?: string };
  serviceId?: { name: string };
  businessId?: { _id: string; name: string; slug: string };
  employeeId?: { firstName: string; lastName: string; email: string; phone?: string };
  teamLeaderId?: { firstName: string; lastName: string; email: string; phone?: string };
}

export interface BookingLineItem {
  _id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  action: string;
  notes?: string;
}

export interface BookingAssignment {
  _id: string;
  isTeamLeader: boolean;
  employeeResponse: string;
  status: string;
  userId?: { firstName: string; lastName: string; email: string; phone?: string };
  employeeId?: { employeeCode: string; designation: string };
}

export interface BookingDetail {
  booking: BookingItem;
  lineItems: BookingLineItem[];
  assignments: BookingAssignment[];
  materials: Array<{ _id: string; name: string; type: string; quantity: number; unitPrice: number; totalPrice: number }>;
  payments: Array<{ _id: string; amount: number; method: string; status: string; createdAt: string }>;
  statusHistory: Array<{ _id: string; fromStatus?: string; toStatus: string; createdAt: string; notes?: string }>;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),
  me: () => api.get<ApiResponse<UserProfile>>('/auth/me'),
  updateMe: (data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) =>
    api.put<ApiResponse<UserProfile>>('/auth/me', data),
  logout: () => api.post('/auth/logout'),
  registerDevice: (data: {
    platform: 'web' | 'admin_web' | 'android' | 'ios';
    onesignalSubscriptionId?: string;
    deviceLabel?: string;
  }) => api.post('/auth/devices/register', data),
  unregisterDevice: (onesignalSubscriptionId?: string) =>
    api.post('/auth/devices/unregister', { onesignalSubscriptionId }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};

export const businessApi = {
  list: (page = 1) => api.get<ApiResponse<BusinessItem[]>>('/businesses', { params: { page } }),
  get: (id: string) => api.get<ApiResponse<BusinessItem>>(`/businesses/${id}`),
  update: (
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      logo?: string;
      address?: BusinessItem['address'];
    },
  ) => api.put<ApiResponse<BusinessItem>>(`/businesses/${id}`, data),
};

export const DEFAULT_SERVICE_ICON = 'solar:box-minimalistic-linear';
export const DEFAULT_CATEGORY_ICON = 'hugeicons:legal-hammer';

export interface ServiceGalleryItem {
  _id: string;
  serviceId: string;
  imagePath: string;
  sortOrder: number;
}

export interface ServiceItem {
  _id: string;
  name: string;
  slug: string;
  serviceCode?: string;
  shortDescription: string;
  fullDescription?: string;
  icon?: string;
  image: string;
  gallery?: ServiceGalleryItem[];
  basePrice?: number;
  mrp?: number;
  salePrice?: number;
  discountPercent?: number;
  discountExpiresAt?: string;
  priceType: 'fixed' | 'hourly' | 'quote-based';
  duration?: number;
  durationUnit?: 'minute' | 'hour' | 'day';
  gstPercentage?: number;
  isFeatured: boolean;
  isPopular: boolean;
  status: 'active' | 'inactive' | 'draft' | 'pending';
  displayOrder: number;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  parentCategoryId?: { _id: string; name: string; slug: string };
  subCategoryId?: { _id: string; name: string; slug: string };
  businessId?: {
    _id: string;
    name: string;
    slug: string;
    ownerId?: { _id: string; firstName: string; lastName: string; email: string };
  };
  cityIds?: { _id: string; name: string; slug: string; state?: string }[];
  createdBy?: { firstName: string; lastName: string; email: string };
}

export type ServiceFormData = {
  businessId: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  subCategoryId: string;
  cityIds: string[];
  serviceCode: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  image: string;
  mrp: number | '';
  salePrice: number | '';
  discountPercent: number | '';
  discountExpiresAt: string;
  basePrice: number | '';
  priceType: 'fixed' | 'hourly' | 'quote-based';
  duration: number | '';
  durationUnit: 'minute' | 'hour' | 'day' | '';
  gstPercentage: number | '';
  status: 'active' | 'inactive' | 'draft' | 'pending';
  displayOrder: number;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
};

export interface FeatureRequestItem {
  _id: string;
  serviceId: { _id: string; name: string; slug: string; image?: string };
  ownerId: { firstName: string; lastName: string; email: string };
  businessId: { name: string; slug: string };
  requestType: 'featured' | 'popular';
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  approvedBy?: { firstName: string; lastName: string; email: string };
  approvedAt?: string;
  createdAt: string;
}

export interface ServiceOwnerListItem {
  _id: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
  };
  business: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    address?: { city?: string; state?: string; street?: string };
  };
  stats: {
    totalServices: number;
    activeServices: number;
    pendingServices: number;
    featuredServices: number;
    popularServices: number;
  };
  autoApproveServices: boolean;
  documentsApproved: number;
  documentsPending: number;
  subscription?: {
    _id: string;
    planId: string;
    planName: string;
    status: string;
    expiresAt: string;
  } | null;
}

export interface ServiceOwnerFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  city: string;
  state: string;
  status: string;
  planId: string;
}

export const DOCUMENT_CATEGORIES = {
  identity: ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License'],
  business: [
    'GST Certificate',
    'Business Registration Certificate',
    'MSME Certificate',
    'Shop Act License',
    'Trade License',
  ],
  bank: ['Cancelled Cheque', 'Bank Passbook Copy'],
  address: ['Utility Bill', 'Rent Agreement', 'Property Tax Receipt'],
  employee: ['Staff Licenses', 'Service Certifications'],
} as const;

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;

export const DOCUMENT_TYPES = [
  ...DOCUMENT_CATEGORIES.identity,
  ...DOCUMENT_CATEGORIES.business,
  ...DOCUMENT_CATEGORIES.bank,
  ...DOCUMENT_CATEGORIES.address,
  ...DOCUMENT_CATEGORIES.employee,
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface BusinessDocumentItem {
  _id: string;
  category?: DocumentCategory;
  type: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  remarks?: string;
  reviewedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  module: string;
  action: string;
  approvalStatus?: string;
  remarks?: string;
  adminId?: { firstName: string; lastName: string; email: string };
  ownerId?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export type EmployeeType = 'office_staff' | 'service_staff';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface EmployeeUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
}

export interface EmployeeSkillItem {
  _id: string;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  serviceId?: { _id: string; name: string; slug: string };
}

export interface EmployeeAvailabilityItem {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface EmployeeItem {
  _id: string;
  employeeCode: string;
  employeeType: EmployeeType;
  designation: string;
  department?: string;
  hireDate?: string;
  status: EmployeeStatus;
  notes?: string;
  userId: EmployeeUser;
  businessId?: { _id: string; name: string; slug: string };
  skills?: EmployeeSkillItem[];
  availability?: EmployeeAvailabilityItem[];
  createdAt: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  officeStaff: number;
  serviceStaff: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeCode: string;
  employeeType: EmployeeType;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  completionRate: number;
  revenueGenerated: number;
  avgCompletionDays: number;
}

export interface EmployeeActivityItem {
  _id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface EmployeeFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeType: EmployeeType;
  designation: string;
  department: string;
  hireDate: string;
  notes: string;
  businessId: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface CustomerItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: CustomerStatus;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  bookingCount: number;
  totalSpent: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

export interface CustomerDetail extends CustomerItem {
  hasPassword?: boolean;
  canViewPassword?: boolean;
  bookings: Array<{
    _id: string;
    bookingNumber: string;
    status: string;
    scheduledAt: string;
    totalAmount: number;
    paymentStatus: string;
    serviceId?: { _id: string; name: string; slug: string };
    businessId?: { _id: string; name: string; slug: string };
  }>;
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
  };
}

export interface CustomerFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: { _id: string; name: string; slug: string } | string | null;
  children?: CategoryItem[];
}

export interface CategoryRequestItem {
  _id: string;
  name: string;
  description?: string;
  parentId?: { _id: string; name: string; slug: string } | string | null;
  icon?: string;
  image?: string;
  sortOrder: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedAt?: string;
  businessId?: { _id: string; name: string; slug: string };
  requestedBy?: { firstName: string; lastName: string; email: string };
  reviewedBy?: { firstName: string; lastName: string; email: string };
  categoryId?: { _id: string; name: string; slug: string };
  createdAt: string;
}

export function getCategoryParentId(category: CategoryItem): string | null {
  if (!category.parentId) return null;
  if (typeof category.parentId === 'object') return category.parentId._id;
  return category.parentId;
}

export function getCategoryDisplayName(category: CategoryItem, categories: CategoryItem[]): string {
  const parentId = getCategoryParentId(category);
  if (!parentId) return category.name;
  const parent = categories.find((item) => item._id === parentId);
  return parent ? `${parent.name} › ${category.name}` : category.name;
}

export function orderCategoriesHierarchically(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];

  const appendChildren = (parentId: string | null) => {
    const siblings = categories
      .filter((item) => getCategoryParentId(item) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    for (const item of siblings) {
      result.push(item);
      appendChildren(item._id);
    }
  };

  appendChildren(null);
  return result;
}

export const mediaApi = {
  uploadCategoryImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ url: string; path: string; width: number; height: number }>>(
      '/media/category-image',
      formData,
    );
  },
  uploadServiceImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ url: string; path: string; width: number; height: number }>>(
      '/media/service-image',
      formData,
    );
  },
  uploadServiceGallery: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ url: string; path: string; width: number; height: number }>>(
      '/media/service-gallery',
      formData,
    );
  },
  uploadBusinessDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post<ApiResponse<{ url: string; path: string; fileName: string }>>(
      '/media/business-document',
      formData,
    );
  },
  uploadPromotionBackgroundImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ url: string; path: string; width: number; height: number }>>(
      '/media/promotion-background-image',
      formData,
    );
  },
  uploadPromotionBackgroundVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post<ApiResponse<{ url: string; path: string; fileName: string }>>(
      '/media/promotion-background-video',
      formData,
    );
  },
};

export const categoryApi = {
  list: (params?: { tree?: boolean; includeInactive?: boolean }) =>
    api.get<ApiResponse<CategoryItem[]>>('/services/categories', {
      params: {
        ...(params?.includeInactive ? { includeInactive: 'true' } : {}),
        ...(params?.tree ? { tree: 'true' } : {}),
      },
    }),
  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    sortOrder?: number;
    parentId?: string | null;
  }) => api.post<ApiResponse<CategoryItem>>('/services/categories', data),
  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
      parentId?: string | null;
    },
  ) => api.put<ApiResponse<CategoryItem>>(`/services/categories/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/services/categories/${id}`),
};

export const categoryRequestApi = {
  list: (status?: string) =>
    api.get<ApiResponse<CategoryRequestItem[]>>('/services/category-requests', {
      params: status ? { status } : undefined,
    }),
  create: (data: {
    name: string;
    description?: string;
    parentId?: string | null;
    icon?: string;
    image?: string;
    sortOrder?: number;
  }) => api.post<ApiResponse<CategoryRequestItem>>('/services/category-requests', data),
  approve: (id: string, reviewNote?: string) =>
    api.put<ApiResponse<unknown>>(`/services/category-requests/${id}/approve`, { reviewNote }),
  reject: (id: string, reviewNote?: string) =>
    api.put<ApiResponse<CategoryRequestItem>>(`/services/category-requests/${id}/reject`, { reviewNote }),
};

export interface CityItem {
  _id: string;
  name: string;
  slug: string;
  state?: string;
  country?: string;
  sortOrder: number;
  isActive: boolean;
}

export const cityApi = {
  listPublic: () => api.get<ApiResponse<CityItem[]>>('/cities'),
  listAdmin: (includeInactive = true) =>
    api.get<ApiResponse<CityItem[]>>('/cities/admin', {
      params: { includeInactive: includeInactive ? 'true' : undefined },
    }),
  create: (data: {
    name: string;
    state?: string;
    country?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => api.post<ApiResponse<CityItem>>('/cities', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<CityItem>>(`/cities/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/cities/${id}`),
};

export const serviceApi = {
  list: (
    page = 1,
    params?: { status?: string; featured?: boolean; popular?: boolean; ownerId?: string },
  ) =>
    api.get<ApiResponse<ServiceItem[]>>('/services', {
      params: {
        page,
        limit: 50,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.featured ? { featured: 'true' } : {}),
        ...(params?.popular ? { popular: 'true' } : {}),
        ...(params?.ownerId ? { ownerId: params.ownerId } : {}),
      },
    }),
  get: (id: string) => api.get<ApiResponse<ServiceItem>>(`/services/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<ServiceItem>>('/services', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<ServiceItem>>(`/services/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/services/${id}`),
  approve: (id: string, remarks?: string) =>
    api.put<ApiResponse<ServiceItem>>(`/services/${id}/approve`, { remarks }),
  addGalleryImage: (serviceId: string, imagePath: string, sortOrder?: number) =>
    api.post<ApiResponse<ServiceGalleryItem>>(`/services/${serviceId}/gallery`, { imagePath, sortOrder }),
  removeGalleryImage: (serviceId: string, galleryId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/services/${serviceId}/gallery/${galleryId}`),
  listCategories: () => api.get<ApiResponse<CategoryItem[]>>('/services/categories'),
};

export const featureRequestApi = {
  list: (status?: string) =>
    api.get<ApiResponse<FeatureRequestItem[]>>('/services/feature-requests', {
      params: status ? { status } : undefined,
    }),
  create: (data: { serviceId: string; requestType: 'featured' | 'popular'; remarks?: string }) =>
    api.post<ApiResponse<FeatureRequestItem>>('/services/feature-requests', data),
  approve: (id: string, remarks?: string) =>
    api.put<ApiResponse<FeatureRequestItem>>(`/services/feature-requests/${id}/approve`, { remarks }),
  reject: (id: string, remarks?: string) =>
    api.put<ApiResponse<FeatureRequestItem>>(`/services/feature-requests/${id}/reject`, { remarks }),
};

export const serviceOwnerApi = {
  list: (params?: {
    page?: number;
    search?: string;
    status?: string;
    city?: string;
    categoryId?: string;
    autoApprove?: boolean;
  }) =>
    api.get<ApiResponse<ServiceOwnerListItem[]>>('/service-owners', {
      params: {
        page: params?.page ?? 1,
        limit: 50,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.city ? { city: params.city } : {}),
        ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params?.autoApprove !== undefined ? { autoApprove: String(params.autoApprove) } : {}),
      },
    }),
  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    businessName: string;
    businessEmail?: string;
    businessPhone?: string;
    address?: { city?: string; state?: string };
  }) => api.post<ApiResponse<unknown>>('/service-owners', data),
  getProfile: (id: string) => api.get<ApiResponse<unknown>>(`/service-owners/${id}`),
  update: (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      status?: string;
      businessName?: string;
      businessEmail?: string;
      businessPhone?: string;
      planId?: string;
      address?: { city?: string; state?: string };
    },
  ) => api.put<ApiResponse<unknown>>(`/service-owners/${id}`, data),
  resetPassword: (id: string, password: string) =>
    api.put<ApiResponse<{ message: string }>>(`/service-owners/${id}/reset-password`, { password }),
  setAutoApprove: (id: string, enabled: boolean) =>
    api.put<ApiResponse<unknown>>(`/service-owners/${id}/auto-approve`, { enabled }),
  suspend: (id: string, remarks?: string) =>
    api.put<ApiResponse<unknown>>(`/service-owners/${id}/suspend`, { remarks }),
  activate: (id: string, remarks?: string) =>
    api.put<ApiResponse<unknown>>(`/service-owners/${id}/activate`, { remarks }),
  listDocuments: (params?: { ownerId?: string; status?: string }) =>
    api.get<ApiResponse<BusinessDocumentItem[]>>('/service-owners/documents/list', { params }),
  uploadDocument: (data: {
    type: string;
    filePath: string;
    fileName: string;
    category?: DocumentCategory;
    expiresAt?: string;
  }) => api.post<ApiResponse<BusinessDocumentItem>>('/service-owners/documents', data),
  approveDocument: (id: string, remarks?: string) =>
    api.put<ApiResponse<BusinessDocumentItem>>(`/service-owners/documents/${id}/approve`, { remarks }),
  rejectDocument: (id: string, remarks?: string) =>
    api.put<ApiResponse<BusinessDocumentItem>>(`/service-owners/documents/${id}/reject`, { remarks }),
};

export const auditLogApi = {
  list: (page = 1) => api.get<ApiResponse<AuditLogItem[]>>('/audit-logs', { params: { page, limit: 50 } }),
};

export const bookingApi = {
  stats: () => api.get<ApiResponse<BookingStats>>('/bookings/stats'),
  list: (page = 1, status?: string) =>
    api.get<ApiResponse<BookingItem[]>>('/bookings', { params: { page, limit: 50, status } }),
  get: (id: string) => api.get<ApiResponse<BookingDetail>>(`/bookings/${id}`),
  accept: (id: string, notes?: string) =>
    api.put<ApiResponse<BookingItem>>(`/bookings/${id}/accept`, { notes }),
  reject: (id: string, notes?: string) =>
    api.put<ApiResponse<BookingItem>>(`/bookings/${id}/reject`, { notes }),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<ApiResponse<BookingItem>>(`/bookings/${id}/status`, { status, notes }),
  assign: (id: string, employeeIds: string[], teamLeaderId?: string, notes?: string) =>
    api.post<ApiResponse<BookingItem>>(`/bookings/${id}/assign`, { employeeIds, teamLeaderId, notes }),
  scheduleVisit: (id: string, visitScheduledAt: string, notes?: string) =>
    api.put<ApiResponse<BookingItem>>(`/bookings/${id}/visit-schedule`, { visitScheduledAt, notes }),
  recordPayment: (
    id: string,
    data: { amount: number; method: string; transactionRef?: string; notes?: string },
  ) => api.post<ApiResponse<unknown>>(`/bookings/${id}/payment`, data),
};

export const employeeApi = {
  stats: (params?: { businessId?: string }) =>
    api.get<ApiResponse<EmployeeStats>>('/employees/stats', { params }),
  list: (
    page = 1,
    params?: { status?: string; employeeType?: string; search?: string; businessId?: string },
  ) =>
    api.get<ApiResponse<EmployeeItem[]>>('/employees', {
      params: { page, limit: 50, ...params },
    }),
  listServiceStaff: () => api.get<ApiResponse<EmployeeItem[]>>('/employees/service-staff'),
  get: (id: string) => api.get<ApiResponse<EmployeeItem>>(`/employees/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<EmployeeItem>>('/employees', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<EmployeeItem>>(`/employees/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/employees/${id}`),
  updateSkills: (id: string, skills: Array<{ skillName: string; serviceId?: string; proficiencyLevel?: string }>) =>
    api.put<ApiResponse<EmployeeSkillItem[]>>(`/employees/${id}/skills`, { skills }),
  updateAvailability: (
    id: string,
    availability: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }>,
  ) => api.put<ApiResponse<EmployeeAvailabilityItem[]>>(`/employees/${id}/availability`, { availability }),
  performance: (id: string) => api.get<ApiResponse<EmployeePerformance>>(`/employees/${id}/performance`),
  activities: (id: string, page = 1) =>
    api.get<ApiResponse<EmployeeActivityItem[]>>(`/employees/${id}/activities`, { params: { page, limit: 20 } }),
};

export const customerApi = {
  stats: () => api.get<ApiResponse<CustomerStats>>('/customers/stats'),
  list: (page = 1, params?: { status?: string; search?: string }) =>
    api.get<ApiResponse<CustomerItem[]>>('/customers', {
      params: { page, limit: 50, ...params },
    }),
  get: (id: string) => api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<CustomerItem>>('/customers', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<CustomerItem>>(`/customers/${id}`, data),
  viewPassword: (id: string, adminPassword: string) =>
    api.post<ApiResponse<{ password: string }>>(`/customers/${id}/view-password`, { adminPassword }),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/customers/${id}`),
};

export interface PlanLimits {
  maxEmployees: number;
  maxServices: number;
  maxBanners?: number;
  maxServiceRows?: number;
  maxBookingsPerMonth?: number;
}

export interface PlanItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  durationDays: number;
  limits: PlanLimits;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface SubscriptionItem {
  _id: string;
  businessId: { _id: string; name: string; slug: string; email: string; status: string };
  ownerId: { firstName: string; lastName: string; email: string };
  planId: PlanItem;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  startDate: string;
  expiresAt: string;
  cancelledAt?: string;
  notes?: string;
}

export const planApi = {
  list: (page = 1) => api.get<ApiResponse<PlanItem[]>>('/plans', { params: { page } }),
  listPublic: () => api.get<ApiResponse<PlanItem[]>>('/plans/public'),
  get: (id: string) => api.get<ApiResponse<PlanItem>>(`/plans/${id}`),
  create: (data: {
    name: string;
    description?: string;
    price: number;
    billingCycle?: 'monthly' | 'yearly';
    durationDays: number;
    limits: PlanLimits;
    features?: string[];
    isActive?: boolean;
    sortOrder?: number;
  }) => api.post<ApiResponse<PlanItem>>('/plans', data),
  update: (id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    billingCycle: 'monthly' | 'yearly';
    durationDays: number;
    limits: PlanLimits;
    features: string[];
    isActive: boolean;
    sortOrder: number;
  }>) => api.put<ApiResponse<PlanItem>>(`/plans/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/plans/${id}`),
};

export const subscriptionApi = {
  getStatus: () => api.get<ApiResponse<SubscriptionStatusResponse>>('/subscriptions/status'),
  list: (params?: { page?: number; status?: string; businessId?: string }) =>
    api.get<ApiResponse<SubscriptionItem[]>>('/subscriptions', { params }),
  getMy: () => api.get<ApiResponse<SubscriptionItem>>('/subscriptions/me'),
  get: (id: string) => api.get<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}`),
  assign: (data: {
    businessId: string;
    planId: string;
    status?: string;
    startDate?: string;
    expiresAt?: string;
    notes?: string;
  }) => api.post<ApiResponse<SubscriptionItem>>('/subscriptions', data),
  update: (id: string, data: {
    planId?: string;
    status?: string;
    startDate?: string;
    expiresAt?: string;
    notes?: string;
  }) => api.put<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}`, data),
  renew: (id: string) => api.put<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}/renew`),
  cancel: (id: string) => api.put<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}/cancel`),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/subscriptions/${id}`),
};

export interface PlanRequestItem {
  _id: string;
  businessId: { _id: string; name: string; slug: string; email: string };
  requestedBy: { firstName: string; lastName: string; email: string };
  planId: PlanItem;
  type: 'activate' | 'upgrade';
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  subscription: SubscriptionItem | null;
  pendingRequest: PlanRequestItem | null;
}

export const planRequestApi = {
  list: (status?: string) =>
    api.get<ApiResponse<PlanRequestItem[]>>('/plan-requests', { params: status ? { status } : undefined }),
  create: (data: { planId: string; type: 'activate' | 'upgrade'; note?: string }) =>
    api.post<ApiResponse<PlanRequestItem>>('/plan-requests', data),
  approve: (id: string, reviewNote?: string) =>
    api.put<ApiResponse<PlanRequestItem>>(`/plan-requests/${id}/approve`, { reviewNote }),
  reject: (id: string, reviewNote?: string) =>
    api.put<ApiResponse<PlanRequestItem>>(`/plan-requests/${id}/reject`, { reviewNote }),
};

export type CouponType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_service'
  | 'cashback'
  | 'first_booking';

export type CouponStatus = 'draft' | 'active' | 'scheduled' | 'expired' | 'disabled';

export interface CouponItem {
  _id: string;
  name: string;
  code: string;
  description?: string;
  termsAndConditions?: string;
  couponType: CouponType;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  discountAmount?: number;
  validityStartDate: string;
  validityEndDate: string;
  validityStartTime?: string;
  validityEndTime?: string;
  status: CouponStatus;
  effectiveStatus?: CouponStatus;
  usageLimitType: 'unlimited' | 'total' | 'per_customer';
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  minBookingAmount?: number;
  maxBookingAmount?: number;
  customerEligibility: 'all' | 'new' | 'existing' | 'premium' | 'specific';
  eligibleCustomerIds?: string[];
  serviceRestrictionType: 'all' | 'categories' | 'subcategories' | 'services';
  categoryIds?: string[];
  subcategoryIds?: string[];
  serviceIds?: string[];
  vendorRestrictionType: 'all' | 'selected';
  businessIds?: string[];
  locationRestrictionType: 'all' | 'cities' | 'areas';
  cityNames?: string[];
  areaNames?: string[];
  autoApplyMode: 'manual' | 'best';
  businessId?: string;
  createdAt: string;
}

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsageCount: number;
  totalDiscountGiven: number;
  totalCashback: number;
  conversionRate: number;
  topPerformingCoupons: Array<{
    couponId: string;
    code?: string;
    name?: string;
    usageCount: number;
    totalDiscount: number;
  }>;
  ownerWiseUsage: Array<{ _id: string; count: number; totalDiscount: number }>;
}

export const couponApi = {
  list: (params?: { page?: number; status?: string; search?: string }) =>
    api.get<ApiResponse<CouponItem[]>>('/coupons', { params }),
  get: (id: string) => api.get<ApiResponse<CouponItem>>(`/coupons/${id}`),
  create: (data: Partial<CouponItem>) => api.post<ApiResponse<CouponItem>>('/coupons', data),
  update: (id: string, data: Partial<CouponItem>) =>
    api.put<ApiResponse<CouponItem>>(`/coupons/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/coupons/${id}`),
  duplicate: (id: string) => api.post<ApiResponse<CouponItem>>(`/coupons/${id}/duplicate`),
  disable: (id: string) => api.put<ApiResponse<CouponItem>>(`/coupons/${id}/disable`),
  stats: () => api.get<ApiResponse<CouponStats>>('/coupons/stats'),
  validate: (data: {
    code: string;
    businessId: string;
    subtotal: number;
    serviceIds?: string[];
    autoApply?: boolean;
  }) => api.post<ApiResponse<{
    valid: boolean;
    code?: string;
    discountAmount?: number;
    discountType?: string;
    displayValue?: string;
    message?: string;
  }>>('/coupons/validate', data),
  available: (businessId?: string) =>
    api.get<ApiResponse<CouponItem[]>>('/coupons/available', { params: businessId ? { businessId } : undefined }),
};

export interface NotificationItem {
  _id: string;
  userId?: { _id: string; firstName: string; lastName: string; email: string };
  businessId?: { _id: string; name: string; slug: string };
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  list: (page = 1) => api.get<ApiResponse<NotificationItem[]>>('/notifications', { params: { page } }),
  listAdmin: (page = 1) => api.get<ApiResponse<NotificationItem[]>>('/notifications/admin', { params: { page } }),
  unreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.put<ApiResponse<NotificationItem>>(`/notifications/${id}/read`),
  markAllRead: () => api.put<ApiResponse<{ message: string }>>('/notifications/read-all'),
  send: (data: {
    title: string;
    body: string;
    type?: string;
    userId?: string;
    businessId?: string;
    roleSlug?: string;
  }) => api.post<ApiResponse<{ sent: number }>>('/notifications/send', data),
};

export type PromotionStatus = 'draft' | 'active' | 'inactive';
export type PromotionApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type BannerLayoutType = 'standard' | 'offer' | 'html_landing';
export type BannerType = 'services' | 'link' | 'html' | 'coupon';
export type BannerTextPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export type RedirectionType =
  | 'category'
  | 'subcategory'
  | 'service'
  | 'external_url'
  | 'custom_landing_page';
export type ServiceSourceType = ServiceRowSourceType;
export type ServiceRowSourceType =
  | 'category'
  | 'subcategory'
  | 'selected_services'
  | 'featured'
  | 'best_selling'
  | 'top_rated'
  | 'new_services';
export type PromotionLocation =
  | 'home'
  | 'category'
  | 'search'
  | 'service_details'
  | 'campaign';
export type PromotionPlatform = 'mobile_app' | 'website' | 'owner_dashboard';

export interface PromotionBusinessRef {
  _id: string;
  name: string;
  slug?: string;
  ownerId?: string | { _id: string; firstName: string; lastName: string; email?: string };
}

export interface PromotionBannerItem {
  _id: string;
  name: string;
  status: PromotionStatus;
  approvalStatus?: PromotionApprovalStatus;
  requestedStatus?: PromotionStatus;
  effectiveStatus?: PromotionStatus;
  canEdit?: boolean;
  canSubmit?: boolean;
  startDate: string;
  endDate: string;
  priorityOrder: number;
  bannerImageWeb: string;
  bannerImageMobile?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerType?: BannerType;
  showImageOnly?: boolean;
  textPosition?: BannerTextPosition;
  linkUrl?: string;
  htmlContent?: string;
  maxItems?: number;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  couponId?: string | { _id: string; code: string; name: string };
  bannerLayoutType?: BannerLayoutType;
  redirectionType?: RedirectionType;
  redirectionTargetId?: string;
  redirectionUrl?: string;
  serviceSourceType?: ServiceRowSourceType;
  categoryId?: string | { _id: string; name: string };
  subcategoryId?: string | { _id: string; name: string };
  serviceIds?: string[];
  platforms: PromotionPlatform[];
  locations: PromotionLocation[];
  targetCountries?: string[];
  targetStates?: string[];
  targetCities?: string[];
  customerTargetType: 'all' | 'new' | 'existing' | 'premium';
  viewCount: number;
  clickCount: number;
  businessId?: string | PromotionBusinessRef;
  isPlatformPromotion?: boolean;
  ownerName?: string | null;
  businessName?: string | null;
  createdAt: string;
}

export type ServiceRowBackgroundType = 'none' | 'color' | 'gradient' | 'image' | 'video';

export interface ServiceRowBackground {
  type: ServiceRowBackgroundType;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageUrl?: string;
  imageUrlWeb?: string;
  imageUrlMobile?: string;
  videoSource?: 'upload' | 'youtube';
  videoUrl?: string;
  youtubeUrl?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
}

export interface ServiceRowSpacingSides {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ServiceRowSpacingByViewport {
  web: ServiceRowSpacingSides;
  mobile: ServiceRowSpacingSides;
}

/** @deprecated use ServiceRowSpacingSides */
export type ServiceRowMargin = ServiceRowSpacingSides;
/** @deprecated use ServiceRowSpacingByViewport for rowMargin/rowPadding */
export type ServiceRowPadding = ServiceRowSpacingSides;

export interface ServiceRowItem {
  _id: string;
  rowName: string;
  displayOrder: number;
  isActive: boolean;
  status: PromotionStatus;
  approvalStatus?: PromotionApprovalStatus;
  requestedStatus?: PromotionStatus;
  effectiveStatus?: PromotionStatus;
  canEdit?: boolean;
  canSubmit?: boolean;
  startDate?: string;
  endDate?: string;
  background?: ServiceRowBackground;
  rowMargin?: ServiceRowSpacingByViewport | ServiceRowSpacingSides;
  rowPadding?: ServiceRowSpacingByViewport | ServiceRowSpacingSides;
  rowTitle: string;
  rowSubtitle?: string;
  serviceSourceType: ServiceRowSourceType;
  categoryId?: string | { _id: string; name: string };
  subcategoryId?: string | { _id: string; name: string };
  serviceIds?: string[];
  maxItems: number;
  platforms: PromotionPlatform[];
  locations: PromotionLocation[];
  targetCountries?: string[];
  targetStates?: string[];
  targetCities?: string[];
  customerTargetType: 'all' | 'new' | 'existing' | 'premium';
  viewCount: number;
  clickCount: number;
  businessId?: string | PromotionBusinessRef;
  isPlatformPromotion?: boolean;
  ownerName?: string | null;
  businessName?: string | null;
  createdAt: string;
}

export interface PromotionStats {
  totalBanners: number;
  activeBanners: number;
  totalServiceRows: number;
  activeServiceRows: number;
  totalViews: number;
  totalClicks: number;
  couponUsage: number;
  bookingConversions: number;
  revenueGenerated: number;
  clickThroughRate: number;
  conversionRate: number;
  topBanners: Array<{
    _id: string;
    name: string;
    bannerTitle?: string;
    clickCount: number;
    viewCount: number;
  }>;
  topServiceRows: Array<{
    _id: string;
    rowName: string;
    rowTitle: string;
    clickCount: number;
    viewCount: number;
  }>;
}

export type PromotionLimitsUsage = {
  maxBanners: number;
  maxServiceRows: number;
  bannerCount: number;
  serviceRowCount: number;
  canCreateBanner: boolean;
  canCreateServiceRow: boolean;
  editableBannerId: string | null;
  editableServiceRowId: string | null;
};

export const promotionApi = {
  listBanners: (params?: {
    page?: number;
    status?: string;
    search?: string;
    businessId?: string;
    ownerId?: string;
    scope?: 'platform' | 'owner' | 'all';
  }) => api.get<ApiResponse<PromotionBannerItem[]>>('/promotions/banners', { params }),
  getBanner: (id: string) => api.get<ApiResponse<PromotionBannerItem>>(`/promotions/banners/${id}`),
  createBanner: (data: Partial<PromotionBannerItem>) =>
    api.post<ApiResponse<PromotionBannerItem>>('/promotions/banners', data),
  updateBanner: (id: string, data: Partial<PromotionBannerItem>) =>
    api.put<ApiResponse<PromotionBannerItem>>(`/promotions/banners/${id}`, data),
  submitBanner: (id: string) =>
    api.put<ApiResponse<PromotionBannerItem>>(`/promotions/banners/${id}/submit`),
  approveBanner: (id: string, remarks?: string) =>
    api.put<ApiResponse<PromotionBannerItem>>(`/promotions/banners/${id}/approve`, { remarks }),
  rejectBanner: (id: string, remarks?: string) =>
    api.put<ApiResponse<PromotionBannerItem>>(`/promotions/banners/${id}/reject`, { remarks }),
  deleteBanner: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/promotions/banners/${id}`),
  listServiceRows: (params?: {
    page?: number;
    isActive?: string;
    search?: string;
    businessId?: string;
    ownerId?: string;
    scope?: 'platform' | 'owner' | 'all';
  }) => api.get<ApiResponse<ServiceRowItem[]>>('/promotions/service-rows', { params }),
  getServiceRow: (id: string) =>
    api.get<ApiResponse<ServiceRowItem>>(`/promotions/service-rows/${id}`),
  createServiceRow: (data: Partial<ServiceRowItem>) =>
    api.post<ApiResponse<ServiceRowItem>>('/promotions/service-rows', data),
  updateServiceRow: (id: string, data: Partial<ServiceRowItem>) =>
    api.put<ApiResponse<ServiceRowItem>>(`/promotions/service-rows/${id}`, data),
  submitServiceRow: (id: string) =>
    api.put<ApiResponse<ServiceRowItem>>(`/promotions/service-rows/${id}/submit`),
  approveServiceRow: (id: string, remarks?: string) =>
    api.put<ApiResponse<ServiceRowItem>>(`/promotions/service-rows/${id}/approve`, { remarks }),
  rejectServiceRow: (id: string, remarks?: string) =>
    api.put<ApiResponse<ServiceRowItem>>(`/promotions/service-rows/${id}/reject`, { remarks }),
  deleteServiceRow: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/promotions/service-rows/${id}`),
  stats: () => api.get<ApiResponse<PromotionStats>>('/promotions/stats'),
  activeBanners: (params?: { platform?: string; location?: string; businessId?: string }) =>
    api.get<ApiResponse<PromotionBannerItem[]>>('/promotions/banners/active', { params }),
  activeServiceRows: (params?: { platform?: string; location?: string; businessId?: string }) =>
    api.get<ApiResponse<ServiceRowItem[]>>('/promotions/service-rows/active', { params }),
};

export const ownerProfileApi = {
  getOverview: () => api.get<ApiResponse<OwnerProfileOverview>>('/owner-profile'),
  updatePersonal: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    displayName?: string;
    alternatePhone?: string;
    dateOfBirth?: string;
    gender?: string;
    username?: string;
  }) => api.put<ApiResponse<{ user: UserProfile; profile: OwnerProfileData }>>('/owner-profile/personal', data),
  updateAddress: (data: OwnerProfileData['address']) =>
    api.put<ApiResponse<OwnerProfileData>>('/owner-profile/address', data),
  updatePreferences: (data: NonNullable<OwnerProfileData['preferences']>) =>
    api.put<ApiResponse<OwnerProfileData>>('/owner-profile/preferences', data),
  updateAccount: (data: { twoFactorEnabled?: boolean }) =>
    api.put<ApiResponse<OwnerProfileData>>('/owner-profile/account', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<{ message: string }>>('/owner-profile/password', data),
  getLoginActivity: () => api.get<ApiResponse<LoginActivity>>('/owner-profile/login-activity'),
  updateBusiness: (data: Partial<BusinessItem>) =>
    api.put<ApiResponse<BusinessItem>>('/owner-profile/business', data),
  getPayment: () => api.get<ApiResponse<OwnerPaymentInfo>>('/owner-profile/payment'),
  updatePayment: (data: Partial<OwnerPaymentInfo>) =>
    api.put<ApiResponse<OwnerPaymentInfo>>('/owner-profile/payment', data),
  getEarnings: () => api.get<ApiResponse<OwnerEarnings>>('/owner-profile/payment/earnings'),
};

export interface PlatformAuthSettings {
  otpVerificationEnabled: boolean;
  googleLoginEnabled: boolean;
}

export const platformSettingsApi = {
  getAuth: () => api.get<ApiResponse<PlatformAuthSettings>>('/platform-settings/auth'),
  updateAuth: (data: Partial<PlatformAuthSettings>) =>
    api.put<ApiResponse<PlatformAuthSettings>>('/platform-settings/auth', data),
};
