import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getApiBaseUrl } from '@/lib/api/client';
import type { BookingStatus, Service } from '@/types';
import { BOOKING_TRACKING_STEPS } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date));
}

export function getMediaUrl(path?: string): string {
  if (!path) return '/images/placeholder-service.svg';
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getServicePrice(service: Service): number {
  if (service.salePrice != null && service.salePrice > 0) return service.salePrice;
  if (service.basePrice != null) return service.basePrice;
  return 0;
}

export function getBusinessId(service: Service): string {
  if (typeof service.businessId === 'string') return service.businessId;
  return service.businessId?._id ?? '';
}

export function getBusinessName(service: Service): string {
  if (typeof service.businessId === 'object' && service.businessId?.name) {
    return service.businessId.name;
  }
  return 'Verified Provider';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getBookingStepIndex(status: BookingStatus): number {
  const idx = BOOKING_TRACKING_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'approved') return BOOKING_TRACKING_STEPS.findIndex((s) => s.key === 'awaiting_customer_approval') + 1;
  if (status === 'closed') return BOOKING_TRACKING_STEPS.length - 1;
  return 0;
}

export function filterServicesClient(services: Service[], query: string): Service[] {
  const q = query.trim().toLowerCase();
  if (!q) return services;
  return services.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.shortDescription?.toLowerCase().includes(q) ||
      s.parentCategoryId?.name.toLowerCase().includes(q) ||
      s.subCategoryId?.name.toLowerCase().includes(q) ||
      getBusinessName(s).toLowerCase().includes(q),
  );
}

export function sortServicesClient(services: Service[], sort?: string): Service[] {
  const copy = [...services];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => getServicePrice(a) - getServicePrice(b));
    case 'price_desc':
      return copy.sort((a, b) => getServicePrice(b) - getServicePrice(a));
    case 'rating':
      return copy.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    case 'newest':
    default:
      return copy;
  }
}
