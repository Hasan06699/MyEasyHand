import { Router } from 'express';
import { OwnerProfileController } from './owner-profile.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { validate } from '../../../middleware/validate.middleware';
import {
  updatePersonalSchema,
  updateAddressSchema,
  updatePreferencesSchema,
  updateAccountSchema,
  changePasswordSchema,
  updateBusinessProfileSchema,
  updatePaymentSchema,
} from './owner-profile.validator';

const router = Router();

router.use(authenticate, tenantContext, authorizeRoles('business_owner'));

router.get('/', OwnerProfileController.getOverview);
router.put('/personal', validate(updatePersonalSchema), OwnerProfileController.updatePersonal);
router.put('/address', validate(updateAddressSchema), OwnerProfileController.updateAddress);
router.put('/preferences', validate(updatePreferencesSchema), OwnerProfileController.updatePreferences);
router.put('/account', validate(updateAccountSchema), OwnerProfileController.updateAccount);
router.put('/password', validate(changePasswordSchema), OwnerProfileController.changePassword);
router.get('/login-activity', OwnerProfileController.getLoginActivity);
router.put('/business', validate(updateBusinessProfileSchema), OwnerProfileController.updateBusiness);
router.get('/payment', OwnerProfileController.getPayment);
router.put('/payment', validate(updatePaymentSchema), OwnerProfileController.updatePayment);
router.get('/payment/earnings', OwnerProfileController.getEarnings);

export default router;
