import { Router } from 'express';
import { ServiceController, serviceValidators } from './service.controller';
import { authenticate, optionalAuth } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

// Categories (must be before /:id)
router.get('/categories', optionalAuth, ServiceController.listCategories);
router.get(
  '/categories/:id',
  authenticate,
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  ServiceController.getCategory,
);
router.post(
  '/categories',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.createCategory,
  ServiceController.createCategory,
);
router.put(
  '/categories/:id',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.updateCategory,
  ServiceController.updateCategory,
);
router.delete(
  '/categories/:id',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  ServiceController.deleteCategory,
);

// Category requests (business owner submits, super admin approves)
router.get(
  '/category-requests',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  ServiceController.listCategoryRequests,
);
router.post(
  '/category-requests',
  authenticate,
  tenantContext,
  authorizeRoles('business_owner'),
  requireActiveSubscription,
  serviceValidators.createCategoryRequest,
  ServiceController.createCategoryRequest,
);
router.put(
  '/category-requests/:id/approve',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.reviewCategoryRequest,
  ServiceController.approveCategoryRequest,
);
router.put(
  '/category-requests/:id/reject',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.reviewCategoryRequest,
  ServiceController.rejectCategoryRequest,
);

// Feature requests (featured / popular)
router.get(
  '/feature-requests',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  ServiceController.listFeatureRequests,
);
router.post(
  '/feature-requests',
  authenticate,
  tenantContext,
  authorizeRoles('business_owner'),
  requireActiveSubscription,
  serviceValidators.createFeatureRequest,
  ServiceController.createFeatureRequest,
);
router.put(
  '/feature-requests/:id/approve',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.reviewFeatureRequest,
  ServiceController.approveFeatureRequest,
);
router.put(
  '/feature-requests/:id/reject',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.reviewFeatureRequest,
  ServiceController.rejectFeatureRequest,
);

router.get('/', optionalAuth, ServiceController.list);
router.post('/', authenticate, tenantContext, authorizeRoles('super_admin', 'business_owner'), requireActiveSubscription, serviceValidators.create, ServiceController.create);
router.put(
  '/:id/approve',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceValidators.approveService,
  ServiceController.approveService,
);
router.post(
  '/:id/gallery',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  requireActiveSubscription,
  serviceValidators.galleryImage,
  ServiceController.addGalleryImage,
);
router.delete(
  '/:id/gallery/:galleryId',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  requireActiveSubscription,
  ServiceController.removeGalleryImage,
);
router.put(
  '/:id',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  requireActiveSubscription,
  serviceValidators.update,
  ServiceController.update,
);
router.delete(
  '/:id',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  requireActiveSubscription,
  ServiceController.delete,
);
router.get('/:id', optionalAuth, ServiceController.getById);

export default router;
