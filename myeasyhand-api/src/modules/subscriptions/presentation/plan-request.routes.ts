import { Router } from 'express';
import { PlanRequestController, planRequestValidators } from './plan-request.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', authorizeRoles('super_admin', 'business_owner'), PlanRequestController.list);
router.post('/', authorizeRoles('business_owner'), planRequestValidators.create, PlanRequestController.create);
router.put('/:id/approve', authorize('subscriptions.manage'), planRequestValidators.review, PlanRequestController.approve);
router.put('/:id/reject', authorize('subscriptions.manage'), planRequestValidators.review, PlanRequestController.reject);

export default router;
