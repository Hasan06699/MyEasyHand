import { Types } from 'mongoose';
import crypto from 'crypto';
import { Service } from '../../../database/models/service.model';
import { BookingStatus } from '../booking.constants';

export function generateBookingNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const sixDigit = Math.floor(100000 + Math.random() * 900000).toString();
  return `SHV-${datePart}-${sixDigit}`;
}

export function generateOrderGroupId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateQrToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function getEffectiveServicePrice(service: {
  priceType: string;
  basePrice?: number;
  salePrice?: number;
  mrp?: number;
  discountExpiresAt?: Date | string;
}): number {
  if (service.priceType === 'quote-based') return 0;
  const discountActive =
    service.salePrice != null &&
    (!service.discountExpiresAt || new Date(service.discountExpiresAt) > new Date());
  if (discountActive) return service.salePrice!;
  return service.basePrice ?? service.salePrice ?? service.mrp ?? 0;
}

export function calculateTotals(
  subtotal: number,
  discountAmount = 0,
  taxPercent = 0,
): { subtotal: number; discountAmount: number; taxAmount: number; totalAmount: number } {
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount: afterDiscount + taxAmount,
  };
}

export function normalizeLegacyStatus(status: string): BookingStatus {
  if (status === 'confirmed') return 'accepted';
  if (status === 'in_progress') return 'service_in_progress';
  return status as BookingStatus;
}

export async function resolveServicePrice(serviceId: string): Promise<{
  service: Awaited<ReturnType<typeof Service.findOne>>;
  unitPrice: number;
}> {
  const service = await Service.findOne({ _id: serviceId, isDeleted: false, status: 'active' });
  if (!service) return { service: null, unitPrice: 0 };
  return { service, unitPrice: getEffectiveServicePrice(service) };
}

export function groupItemsByBusiness<T extends { businessId: Types.ObjectId }>(
  items: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.businessId.toString();
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return groups;
}

/** Extract string id from ObjectId, populated doc, or plain string. */
export function getRefId(
  value: Types.ObjectId | { _id?: Types.ObjectId | string; id?: string } | string | null | undefined,
): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object') {
    if (value._id != null) return value._id.toString();
    if (value.id != null) return String(value.id);
  }
  return String(value);
}
