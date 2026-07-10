export { api, getApiBaseUrl } from './api/client';
export { authApi } from './api/auth';
export { businessApi } from './api/businesses';
export { serviceApi, cityApi } from './api/services';
export { bookingApi } from './api/bookings';
export { promotionApi, couponApi } from './api/promotions';
export { cartApi } from './api/cart';
export type { ServerCartResponse, SaveCartPayload } from './api/cart';
export { notificationApi } from './api/notifications';

// Backward-compatible re-exports
export type {
  ApiResponse,
  User,
  Business,
  Service,
  Booking,
  BookingDetail,
  ServiceCategory,
  PromotionBanner,
  ServiceRow,
  CouponSummary,
  Notification,
} from '@/types';
