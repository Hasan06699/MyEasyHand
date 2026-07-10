import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  phone: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  userId: Joi.string().required(),
  code: Joi.string().length(6).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(8).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

export const updateMeSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().optional().allow(''),
  avatar: Joi.string().uri().optional().allow(''),
});

export const registerDeviceSchema = Joi.object({
  platform: Joi.string().valid('web', 'admin_web', 'android', 'ios').required(),
  onesignalSubscriptionId: Joi.string().optional().allow(''),
  deviceLabel: Joi.string().max(200).optional().allow(''),
});

export const unregisterDeviceSchema = Joi.object({
  onesignalSubscriptionId: Joi.string().optional().allow(''),
});

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
});
