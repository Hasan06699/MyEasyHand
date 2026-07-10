import { Router } from 'express';
import Joi from 'joi';
import { PlatformSettingsController } from './platform-settings.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { validate } from '../../../middleware/validate.middleware';

const router = Router();

const updateAuthSchema = Joi.object({
  otpVerificationEnabled: Joi.boolean().optional(),
  googleLoginEnabled: Joi.boolean().optional(),
}).min(1);

router.get('/public', PlatformSettingsController.getPublic);

router.get(
  '/auth',
  authenticate,
  authorizeRoles('super_admin'),
  PlatformSettingsController.getAuth,
);

router.put(
  '/auth',
  authenticate,
  authorizeRoles('super_admin'),
  validate(updateAuthSchema),
  PlatformSettingsController.updateAuth,
);

export default router;
