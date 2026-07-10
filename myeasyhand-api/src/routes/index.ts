import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import authRoutes from '../modules/auth/presentation/auth.routes';
import businessRoutes from '../modules/businesses/presentation/business.routes';
import serviceRoutes from '../modules/services/presentation/service.routes';
import bookingRoutes from '../modules/bookings/presentation/booking.routes';
import mediaRoutes from '../modules/media/presentation/media.routes';
import planRoutes from '../modules/subscriptions/presentation/plan.routes';
import subscriptionRoutes from '../modules/subscriptions/presentation/subscription.routes';
import planRequestRoutes from '../modules/subscriptions/presentation/plan-request.routes';
import notificationRoutes from '../modules/notifications/presentation/notification.routes';
import serviceOwnerRoutes from '../modules/service-owners/presentation/service-owner.routes';
import auditLogRoutes from '../modules/audit/presentation/audit-log.routes';
import employeeRoutes from '../modules/employees/presentation/employee.routes';
import customerRoutes from '../modules/customers/presentation/customer.routes';
import ownerProfileRoutes from '../modules/owner-profile/presentation/owner-profile.routes';
import couponRoutes from '../modules/coupons/presentation/coupon.routes';
import promotionRoutes from '../modules/promotions/presentation/promotion.routes';
import cartRoutes from '../modules/cart/presentation/cart.routes';
import platformSettingsRoutes from '../modules/platform-settings/presentation/platform-settings.routes';
import { getRedis } from '../config/redis';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let redisOk = false;
  try {
    const redis = getRedis();
    redisOk = (await redis.ping()) === 'PONG';
  } catch {
    redisOk = false;
  }

  const ready = mongoOk && redisOk;
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: { mongo: mongoOk, redis: redisOk },
  });
});

router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/media', mediaRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plan-requests', planRequestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/service-owners', serviceOwnerRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/employees', employeeRoutes);
router.use('/customers', customerRoutes);
router.use('/owner-profile', ownerProfileRoutes);
router.use('/coupons', couponRoutes);
router.use('/promotions', promotionRoutes);
router.use('/cart', cartRoutes);
router.use('/platform-settings', platformSettingsRoutes);

export default router;
