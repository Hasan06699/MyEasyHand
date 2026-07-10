import Joi from 'joi';

export const updatePersonalSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().optional().allow(''),
  avatar: Joi.string().uri().optional().allow(''),
  displayName: Joi.string().max(100).optional().allow(''),
  alternatePhone: Joi.string().optional().allow(''),
  dateOfBirth: Joi.date().iso().optional().allow(null, ''),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional().allow(''),
  username: Joi.string().alphanum().min(3).max(30).optional().allow(''),
});

export const updateAddressSchema = Joi.object({
  country: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  area: Joi.string().optional().allow(''),
  completeAddress: Joi.string().optional().allow(''),
  postalCode: Joi.string().optional().allow(''),
});

export const updatePreferencesSchema = Joi.object({
  language: Joi.string().optional(),
  timezone: Joi.string().optional(),
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
});

export const updateAccountSchema = Joi.object({
  twoFactorEnabled: Joi.boolean().optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const updateBusinessProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().allow(''),
  logo: Joi.string().uri().optional().allow(''),
  banner: Joi.string().uri().optional().allow(''),
  businessType: Joi.string()
    .valid('individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'other')
    .optional()
    .allow(''),
  supportPhone: Joi.string().optional().allow(''),
  whatsapp: Joi.string().optional().allow(''),
  about: Joi.string().max(2000).optional().allow(''),
  companyOverview: Joi.string().max(5000).optional().allow(''),
  yearsOfExperience: Joi.number().min(0).optional().allow(null),
  businessHours: Joi.array()
    .items(
      Joi.object({
        dayOfWeek: Joi.number().min(0).max(6).required(),
        openTime: Joi.string().optional().allow(''),
        closeTime: Joi.string().optional().allow(''),
        isClosed: Joi.boolean().optional(),
      }),
    )
    .optional(),
  holidayNote: Joi.string().max(1000).optional().allow(''),
  emergencyServiceAvailable: Joi.boolean().optional(),
  publishStatus: Joi.string().valid('draft', 'published', 'active', 'inactive').optional(),
  social: Joi.object({
    website: Joi.string().uri().optional().allow(''),
    facebook: Joi.string().uri().optional().allow(''),
    instagram: Joi.string().uri().optional().allow(''),
    linkedin: Joi.string().uri().optional().allow(''),
    youtube: Joi.string().uri().optional().allow(''),
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow(''),
  }).optional(),
});

export const updatePaymentSchema = Joi.object({
  bankAccount: Joi.object({
    accountHolderName: Joi.string().optional().allow(''),
    bankName: Joi.string().optional().allow(''),
    accountNumber: Joi.string().optional().allow(''),
    ifscCode: Joi.string().optional().allow(''),
    branchName: Joi.string().optional().allow(''),
    accountType: Joi.string().valid('savings', 'current').optional().allow(''),
  }).optional(),
  upi: Joi.object({
    upiId: Joi.string().optional().allow(''),
    qrCodeUrl: Joi.string().uri().optional().allow(''),
  }).optional(),
  payout: Joi.object({
    automaticSettlement: Joi.boolean().optional(),
    manualWithdrawal: Joi.boolean().optional(),
    settlementFrequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
  }).optional(),
  tax: Joi.object({
    gstNumber: Joi.string().optional().allow(''),
    panNumber: Joi.string().optional().allow(''),
    taxCertificateUrl: Joi.string().uri().optional().allow(''),
  }).optional(),
});
