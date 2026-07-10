import Constants from 'expo-constants';
import type { BookingStatus } from '@/types';
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

export function getUserDisplayName(firstName?: string, lastName?: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || 'Employee';
}

export function getBookingStepIndex(status: BookingStatus): number {
  const idx = BOOKING_TRACKING_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'approved') {
    return BOOKING_TRACKING_STEPS.findIndex((s) => s.key === 'awaiting_customer_approval') + 1;
  }
  if (status === 'closed') return BOOKING_TRACKING_STEPS.length - 1;
  if (status === 'accepted') return 0;
  return 0;
}

export function isEmployeeRole(roleSlugs: string[]): boolean {
  return roleSlugs.includes('employee');
}
