import { Router } from 'express';
import { PromotionController, promotionValidators } from './promotion.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

// Public / customer-facing (authenticated optional for tracking)
router.get('/banners/active', PromotionController.activeBanners);
router.get('/banners/active/:id', PromotionController.activeBannerById);
router.get('/service-rows/active', PromotionController.activeServiceRows);

router.post('/track', authenticate, promotionValidators.trackEvent, PromotionController.trackEvent);

router.use(authenticate);
router.use(tenantContext);

// Analytics
router.get('/stats', authorizeRoles('super_admin', 'business_owner'), PromotionController.stats);

// Banners
router.get(
  '/banners',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  PromotionController.listBanners,
);
router.get(
  '/banners/:id',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  PromotionController.getBanner,
);
router.post(
  '/banners',
  authorize('promotions.manage'),
  requireActiveSubscription,
  promotionValidators.createBanner,
  PromotionController.createBanner,
);
router.put(
  '/banners/:id',
  authorize('promotions.manage'),
  requireActiveSubscription,
  promotionValidators.updateBanner,
  PromotionController.updateBanner,
);
router.delete(
  '/banners/:id',
  authorize('promotions.manage'),
  requireActiveSubscription,
  PromotionController.removeBanner,
);
router.put(
  '/banners/:id/submit',
  authorize('promotions.manage'),
  requireActiveSubscription,
  PromotionController.submitBanner,
);
router.put(
  '/banners/:id/approve',
  authorizeRoles('super_admin'),
  promotionValidators.approvePromotion,
  PromotionController.approveBanner,
);
router.put(
  '/banners/:id/reject',
  authorizeRoles('super_admin'),
  promotionValidators.rejectPromotion,
  PromotionController.rejectBanner,
);

// Service Rows
router.get(
  '/service-rows',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  PromotionController.listServiceRows,
);
router.get(
  '/service-rows/:id',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  PromotionController.getServiceRow,
);
router.post(
  '/service-rows',
  authorize('promotions.manage'),
  requireActiveSubscription,
  promotionValidators.createServiceRow,
  PromotionController.createServiceRow,
);
router.put(
  '/service-rows/:id',
  authorize('promotions.manage'),
  requireActiveSubscription,
  promotionValidators.updateServiceRow,
  PromotionController.updateServiceRow,
);
router.delete(
  '/service-rows/:id',
  authorize('promotions.manage'),
  requireActiveSubscription,
  PromotionController.removeServiceRow,
);
router.put(
  '/service-rows/:id/submit',
  authorize('promotions.manage'),
  requireActiveSubscription,
  PromotionController.submitServiceRow,
);
router.put(
  '/service-rows/:id/approve',
  authorizeRoles('super_admin'),
  promotionValidators.approvePromotion,
  PromotionController.approveServiceRow,
);
router.put(
  '/service-rows/:id/reject',
  authorizeRoles('super_admin'),
  promotionValidators.rejectPromotion,
  PromotionController.rejectServiceRow,
);

export default router;
