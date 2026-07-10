import { Router } from 'express';
import { PlanController, planValidators } from './plan.controller';
import { authenticate, optionalAuth } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';

const router = Router();

router.get('/public', PlanController.listPublic);
router.get('/public/:id', optionalAuth, PlanController.get);

router.use(authenticate);

router.get('/', authorizeRoles('super_admin'), PlanController.list);
router.get('/:id', authorizeRoles('super_admin', 'business_owner'), PlanController.get);
router.post('/', authorize('plans.manage'), planValidators.create, PlanController.create);
router.put('/:id', authorize('plans.manage'), planValidators.update, PlanController.update);
router.delete('/:id', authorize('plans.manage'), PlanController.remove);

export default router;
