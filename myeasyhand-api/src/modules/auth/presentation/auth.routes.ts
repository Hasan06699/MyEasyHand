import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  registerDeviceSchema,
  unregisterDeviceSchema,
  googleLoginSchema,
} from './auth.validator';
import { authenticate } from '../../../middleware/auth.middleware';
import { authRateLimiter } from '../../../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/google', authRateLimiter, validate(googleLoginSchema), AuthController.googleLogin);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.put('/me', authenticate, validate(updateMeSchema), AuthController.updateMe);
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

router.post('/devices/register', authenticate, validate(registerDeviceSchema), AuthController.registerDevice);
router.post('/devices/unregister', authenticate, validate(unregisterDeviceSchema), AuthController.unregisterDevice);
router.get('/devices', authenticate, AuthController.listDevices);

export default router;
