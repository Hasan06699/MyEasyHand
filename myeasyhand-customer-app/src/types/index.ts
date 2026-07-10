export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export interface User {
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
}

export interface Business {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  banner?: string;
  about?: string;
  status: string;
}

export interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null | { _id?: string; name?: string; slug?: string };
  children?: ServiceCategory[];
  status?: string;
}

export interface Service {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  serviceImage?: string;
  image?: string;
  icon?: string;
  duration?: number;
  durationUnit?: 'minute' | 'hour' | 'day';
  basePrice?: number;
  mrp?: number;
  salePrice?: number;
  discountPercent?: number;
  priceType?: 'fixed' | 'hourly' | 'quote-based';
  businessId: string | Business;
  parentCategoryId?: { _id?: string; name: string; slug?: string };
  subCategoryId?: { _id?: string; name: string; slug?: string };
  isFeatured?: boolean;
  isPopular?: boolean;
  status?: string;
  gallery?: { _id: string; url: string; type?: string; caption?: string }[];
  features?: string[];
  faqs?: { question: string; answer: string }[];
  averageRating?: number;
  reviewCount?: number;
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'employee_assigned'
  | 'employee_accepted'
  | 'visit_scheduled'
  | 'visit_started'
  | 'service_in_progress'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'completed'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'
  | 'refunded'
  | 'confirmed'
  | 'in_progress';

export type PaymentStatus = 'pending' | 'partial_paid' | 'paid' | 'failed' | 'refunded';

export interface BookingLineItem {
  _id: string;
  serviceId: string | Service;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface BookingAssignment {
  _id: string;
  employeeId: { _id: string; firstName?: string; lastName?: string; employeeCode?: string };
  userId?: { _id: string; firstName?: string; lastName?: string; phone?: string; avatar?: string };
  employeeResponse?: 'pending' | 'accepted' | 'rejected';
}

export interface StatusHistoryItem {
  fromStatus?: string;
  toStatus: string;
  changedBy?: { firstName?: string; lastName?: string };
  notes?: string;
  createdAt: string;
}

export interface CustomerApproval {
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  requestedAt?: string;
  respondedAt?: string;
  draftAmount?: number;
  notes?: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  orderGroupId?: string;
  status: BookingStatus;
  scheduledAt: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  couponCode?: string;
  serviceId?: Service;
  businessId?: Business | string;
  visitOtp?: string;
  visitQrCode?: string;
  visitVerification?: { otp?: string; qrToken?: string };
  customerApproval?: CustomerApproval;
  createdAt?: string;
}

export interface BookingDetail {
  booking: Booking;
  lineItems: BookingLineItem[];
  assignments: BookingAssignment[];
  payments: { _id: string; amount: number; method: string; status: string }[];
  statusHistory: StatusHistoryItem[];
}

export interface CheckoutItem {
  serviceId: string;
  quantity: number;
  notes?: string;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  scheduledAt: string;
  notes?: string;
  couponCode?: string;
  autoApplyBestCoupon?: boolean;
  cityName?: string;
  areaName?: string;
}

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

export interface PromotionBanner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  htmlContent?: string;
  couponId?: { code?: string; displayValue?: string; name?: string; description?: string };
  backgroundColor?: string;
  textColor?: string;
  bannerLayoutType?: 'standard' | 'offer' | 'html_landing';
  bannerType?: BannerType;
  showImageOnly?: boolean;
  textPosition?: BannerTextPosition;
  ctaButtonText?: string;
  services?: Service[];
}

export interface ServiceRow {
  _id: string;
  title: string;
  subtitle?: string;
  services: Service[];
  serviceSourceType?: string;
  categoryId?: { _id?: string; name?: string; slug?: string } | string;
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  discountAmount?: number;
  message?: string;
}

export interface Notification {
  _id: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface ServiceFilters {
  page?: number;
  limit?: number;
  featured?: boolean;
  popular?: boolean;
  parentCategoryId?: string;
  categoryId?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

export interface CartItem {
  serviceId: string;
  service: Service;
  quantity: number;
  notes?: string;
}

export interface ReviewPayload {
  serviceRating: number;
  employeeRating?: number;
  comment?: string;
}
