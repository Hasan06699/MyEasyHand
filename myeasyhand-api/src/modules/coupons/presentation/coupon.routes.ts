import { Router } from 'express';
import { CouponController, couponValidators } from './coupon.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

router.get('/available', authenticate, CouponController.available);

router.use(authenticate);

router.post('/validate', authorize('bookings.create'), couponValidators.validate, CouponController.validate);

router.use(tenantContext);

router.get('/stats', authorizeRoles('super_admin', 'business_owner'), CouponController.stats);
router.get('/', authorizeRoles('super_admin', 'business_owner', 'employee'), CouponController.list);
router.get('/:id', authorizeRoles('super_admin', 'business_owner', 'employee'), CouponController.get);
router.post(
  '/',
  authorize('coupons.manage'),
  requireActiveSubscription,
  couponValidators.create,
  CouponController.create,
);
router.put(
  '/:id',
  authorize('coupons.manage'),
  requireActiveSubscription,
  couponValidators.update,
  CouponController.update,
);
router.delete(
  '/:id',
  authorize('coupons.manage'),
  requireActiveSubscription,
  CouponController.remove,
);
router.post(
  '/:id/duplicate',
  authorize('coupons.manage'),
  requireActiveSubscription,
  CouponController.duplicate,
);
router.put(
  '/:id/disable',
  authorize('coupons.manage'),
  requireActiveSubscription,
  CouponController.disable,
);

export default router;
