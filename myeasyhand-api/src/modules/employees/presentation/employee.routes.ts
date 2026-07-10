import { Router } from 'express';
import { EmployeeController, employeeValidators } from './employee.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/stats', authorize('employees.manage'), requireActiveSubscription, EmployeeController.stats);
router.get(
  '/service-staff',
  authorize('employees.manage', 'bookings.assign'),
  requireActiveSubscription,
  EmployeeController.listServiceStaff,
);
router.get('/', authorize('employees.manage'), requireActiveSubscription, EmployeeController.list);
router.post(
  '/',
  authorize('employees.manage'),
  requireActiveSubscription,
  employeeValidators.create,
  EmployeeController.create,
);

router.get(
  '/me',
  authorizeRoles('employee'),
  requireActiveSubscription,
  EmployeeController.getMe,
);

router.get(
  '/:id/performance',
  authorize('employees.manage'),
  requireActiveSubscription,
  EmployeeController.performance,
);
router.get(
  '/:id/activities',
  authorize('employees.manage'),
  requireActiveSubscription,
  EmployeeController.activities,
);
router.put(
  '/:id/skills',
  authorize('employees.manage'),
  requireActiveSubscription,
  employeeValidators.updateSkills,
  EmployeeController.updateSkills,
);
router.put(
  '/:id/availability',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  requireActiveSubscription,
  employeeValidators.updateAvailability,
  EmployeeController.updateAvailability,
);

router.get(
  '/:id',
  authorizeRoles('super_admin', 'business_owner', 'employee'),
  requireActiveSubscription,
  EmployeeController.getById,
);
router.put(
  '/:id',
  authorize('employees.manage'),
  requireActiveSubscription,
  employeeValidators.update,
  EmployeeController.update,
);
router.delete(
  '/:id',
  authorize('employees.manage'),
  requireActiveSubscription,
  EmployeeController.delete,
);

export default router;
