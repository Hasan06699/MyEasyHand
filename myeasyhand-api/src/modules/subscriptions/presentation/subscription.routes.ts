import { Router } from 'express';
import { SubscriptionController, subscriptionValidators } from './subscription.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/status', authorizeRoles('business_owner'), SubscriptionController.getStatus);
router.get('/me', authorizeRoles('business_owner'), SubscriptionController.getMy);
router.get('/', authorize('subscriptions.manage'), SubscriptionController.list);
router.get('/:id', authorizeRoles('super_admin', 'business_owner'), SubscriptionController.get);
router.post('/', authorize('subscriptions.manage'), subscriptionValidators.assign, SubscriptionController.assign);
router.put('/:id', authorize('subscriptions.manage'), subscriptionValidators.update, SubscriptionController.update);
router.put('/:id/renew', authorize('subscriptions.manage'), SubscriptionController.renew);
router.put('/:id/cancel', authorizeRoles('super_admin', 'business_owner'), SubscriptionController.cancel);
router.delete('/:id', authorize('subscriptions.manage'), SubscriptionController.remove);

export default router;
