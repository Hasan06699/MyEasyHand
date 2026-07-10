import { Router } from 'express';
import { BusinessController, businessValidators } from './business.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

// Public routes (no auth)
router.get('/public', BusinessController.listPublic);
router.get('/public/:slug', BusinessController.getBySlug);

router.use(authenticate, tenantContext);

router.get('/', authorize('businesses.read'), BusinessController.list);
router.get('/:id', authorize('businesses.read'), BusinessController.get);
router.post(
  '/',
  authorizeRoles('super_admin', 'business_owner'),
  businessValidators.create,
  BusinessController.create,
);
router.put('/:id', authorize('businesses.update'), businessValidators.update, BusinessController.update);
router.delete('/:id', authorizeRoles('super_admin'), BusinessController.remove);

export default router;
