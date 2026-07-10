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

export const PAYMENT_STATUSES = [
  'pending',
  'partial_paid',
  'paid',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'cash',
  'upi',
  'credit_card',
  'debit_card',
  'net_banking',
  'wallet',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ASSIGNMENT_RESPONSES = ['pending', 'accepted', 'rejected'] as const;
export type AssignmentResponse = (typeof ASSIGNMENT_RESPONSES)[number];

/** Statuses an owner/staff can set directly from admin (all workflow statuses). */
export const ADMIN_MANUAL_STATUSES: BookingStatus[] = [...BOOKING_STATUSES];
