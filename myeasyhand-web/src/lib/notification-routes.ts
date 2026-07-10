const BOOKING_TYPES = new Set([
  'booking_created',
  'booking_status',
  'booking_assigned',
  'job_assigned',
  'visit_scheduled',
  'approval_required',
  'booking_completed',
  'payment_received',
  'customer_approval',
]);

export function getNotificationHref(notification: {
  type: string;
  data?: Record<string, unknown>;
}): string {
  const bookingId = notification.data?.bookingId;
  if (typeof bookingId === 'string' && BOOKING_TYPES.has(notification.type)) {
    return `/dashboard/bookings/${bookingId}`;
  }

  return '/dashboard/notifications';
}

export function getNotificationMessage(notification: {
  body?: string;
  message?: string;
}): string {
  return notification.body ?? notification.message ?? '';
}
