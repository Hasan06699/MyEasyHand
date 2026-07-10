import type { BookingStatus } from '@/types';

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
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  employee_assigned: 'bg-indigo-100 text-indigo-800',
  employee_accepted: 'bg-indigo-100 text-indigo-800',
  visit_scheduled: 'bg-purple-100 text-purple-800',
  visit_started: 'bg-violet-100 text-violet-800',
  service_in_progress: 'bg-violet-100 text-violet-800',
  awaiting_customer_approval: 'bg-orange-100 text-orange-800',
  approved: 'bg-teal-100 text-teal-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
};

export const BOOKING_TRACKING_STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'employee_assigned', label: 'Employee Assigned' },
  { key: 'employee_accepted', label: 'Employee Accepted' },
  { key: 'visit_scheduled', label: 'Visit Scheduled' },
  { key: 'visit_started', label: 'On The Way' },
  { key: 'service_in_progress', label: 'Service Started' },
  { key: 'awaiting_customer_approval', label: 'Awaiting Approval' },
  { key: 'completed', label: 'Completed' },
  { key: 'paid', label: 'Paid' },
];

export const SITE_NAME = 'MyEasyHand';
export const SITE_DESCRIPTION =
  'Book trusted home repairs & cleaning services with verified professionals — city by city across India.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myeasyhand.in';
export const CONTACT_EMAIL = 'info@myeasyhand.in';
export const CONTACT_PHONE = '+91 8818907445';
