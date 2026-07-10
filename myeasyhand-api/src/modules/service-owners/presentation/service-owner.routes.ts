import { Router } from 'express';
import { ServiceOwnerController, serviceOwnerValidators } from './service-owner.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

router.get(
  '/documents/list',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  ServiceOwnerController.listDocuments,
);
router.post(
  '/documents',
  authenticate,
  tenantContext,
  authorizeRoles('business_owner'),
  serviceOwnerValidators.documentUpload,
  ServiceOwnerController.uploadDocument,
);
router.put(
  '/documents/:id/approve',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.review,
  ServiceOwnerController.approveDocument,
);
router.put(
  '/documents/:id/reject',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.review,
  ServiceOwnerController.rejectDocument,
);

router.get('/', authenticate, tenantContext, authorizeRoles('super_admin'), ServiceOwnerController.list);
router.post(
  '/',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.create,
  ServiceOwnerController.create,
);
router.get('/:id', authenticate, tenantContext, authorizeRoles('super_admin'), ServiceOwnerController.getProfile);
router.put(
  '/:id',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.update,
  ServiceOwnerController.update,
);
router.put(
  '/:id/reset-password',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.resetPassword,
  ServiceOwnerController.resetPassword,
);
router.put(
  '/:id/auto-approve',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.autoApprove,
  ServiceOwnerController.setAutoApprove,
);
router.put(
  '/:id/suspend',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.review,
  ServiceOwnerController.suspend,
);
router.put(
  '/:id/activate',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  serviceOwnerValidators.review,
  ServiceOwnerController.activate,
);

export default router;
