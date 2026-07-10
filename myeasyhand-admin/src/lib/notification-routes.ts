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
    return `/bookings?bookingId=${bookingId}`;
  }

  if (
    notification.type.startsWith('subscription_') ||
    notification.type.startsWith('plan_request_')
  ) {
    return '/subscriptions';
  }

  if (
    notification.type.startsWith('document_') ||
    notification.type === 'kyc_completed' ||
    notification.type === 'bank_verification_completed'
  ) {
    return '/profile?tab=documents';
  }

  if (notification.type === 'profile_incomplete') {
    return '/profile';
  }

  if (notification.type.startsWith('promotion_')) {
    return '/promotions';
  }

  return '/notifications';
}
