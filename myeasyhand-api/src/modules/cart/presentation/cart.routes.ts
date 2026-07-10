import { Router } from 'express';
import { CartController, cartValidators } from './cart.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('customer'));

router.get('/', CartController.get);
router.get('/events', CartController.events);
router.put('/', cartValidators.save, CartController.save);
router.delete('/', CartController.clear);

export default router;
