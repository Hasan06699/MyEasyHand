import { Router } from 'express';
import { CustomerController, customerValidators } from './customer.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

router.use(authenticate, tenantContext, authorizeRoles('super_admin', 'business_owner'));

router.get('/stats', requireActiveSubscription, CustomerController.stats);
router.get('/', requireActiveSubscription, CustomerController.list);
router.post('/', requireActiveSubscription, customerValidators.create, CustomerController.create);
router.get('/:id', requireActiveSubscription, CustomerController.getById);
router.post('/:id/view-password', requireActiveSubscription, customerValidators.viewPassword, CustomerController.viewPassword);
router.put('/:id', requireActiveSubscription, customerValidators.update, CustomerController.update);
router.delete('/:id', requireActiveSubscription, CustomerController.delete);

export default router;
