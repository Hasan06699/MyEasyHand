import type { BookingStatus } from '@/types';

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'MyEasyHand';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  employee_assigned: 'Employee Assigned',
  employee_accepted: 'Employee Accepted',
  visit_scheduled: 'Visit Scheduled',
  visit_started: 'On The Way',
  service_in_progress: 'Service Started',
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
  awaiting_customer_approval: '#FB8500',
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
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'employee_assigned', label: 'Assigned' },
  { key: 'employee_accepted', label: 'Accepted' },
  { key: 'visit_scheduled', label: 'Scheduled' },
  { key: 'visit_started', label: 'On The Way' },
  { key: 'service_in_progress', label: 'In Progress' },
  { key: 'awaiting_customer_approval', label: 'Approval' },
  { key: 'completed', label: 'Completed' },
  { key: 'paid', label: 'Paid' },
];

export const CONTACT_EMAIL = 'info@myeasyhand.in';
export const CONTACT_PHONE = '+91 8818907445';
