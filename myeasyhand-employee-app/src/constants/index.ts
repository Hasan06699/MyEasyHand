import type { BookingStatus } from '@/types';

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'MyEasyHand Employee';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  employee_assigned: 'Assigned',
  employee_accepted: 'Accepted',
  visit_scheduled: 'Visit Scheduled',
  visit_started: 'On The Way',
  service_in_progress: 'In Progress',
  awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved',
  completed: 'Completed',
  paid: 'Paid',
  closed: 'Closed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
  refunded: 'Refunded',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#ffc700',
  accepted: '#3b82f6',
  rejected: '#ff623d',
  employee_assigned: '#6366f1',
  employee_accepted: '#6366f1',
  visit_scheduled: '#a855f7',
  visit_started: '#8b5cf6',
  service_in_progress: '#8b5cf6',
  awaiting_customer_approval: '#7c3aed',
  approved: '#14b8a6',
  completed: '#71be34',
  paid: '#10b981',
  closed: '#64748b',
  cancelled: '#ff623d',
  no_show: '#ff623d',
  rescheduled: '#eab308',
  refunded: '#94a3b8',
  confirmed: '#3b82f6',
  in_progress: '#a855f7',
};

export const BOOKING_TRACKING_STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'employee_assigned', label: 'Assigned' },
  { key: 'employee_accepted', label: 'Accepted' },
  { key: 'visit_scheduled', label: 'Scheduled' },
  { key: 'visit_started', label: 'Verified' },
  { key: 'service_in_progress', label: 'In Progress' },
  { key: 'awaiting_customer_approval', label: 'Approval' },
  { key: 'completed', label: 'Completed' },
  { key: 'paid', label: 'Paid' },
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
];
