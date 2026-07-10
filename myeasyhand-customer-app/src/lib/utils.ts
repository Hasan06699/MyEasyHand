import Constants from 'expo-constants';
import type { BookingStatus, Service } from '@/types';
import { BOOKING_TRACKING_STEPS } from '@/constants';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:5050/api/v1';

export function getApiBaseUrl(): string {
  return API_URL.replace(/\/api\/v1$/, '');
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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
  if (!path) return '';
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

export function getBookingStepIndex(status: BookingStatus): number {
  const idx = BOOKING_TRACKING_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'approved') {
    return BOOKING_TRACKING_STEPS.findIndex((s) => s.key === 'awaiting_customer_approval') + 1;
  }
  if (status === 'closed') return BOOKING_TRACKING_STEPS.length - 1;
  return 0;
}

export function getServiceImage(service: Service): string | undefined {
  return service.serviceImage || service.image || service.gallery?.[0]?.url;
}

export function getUserDisplayName(firstName?: string, lastName?: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || 'Guest';
}
