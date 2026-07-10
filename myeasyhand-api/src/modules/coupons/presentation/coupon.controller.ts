import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CouponService } from '../application/coupon.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const objectId = Joi.string().hex().length(24);

const couponBaseSchema = {
  name: Joi.string().required(),
  code: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  termsAndConditions: Joi.string().allow('').optional(),
  couponType: Joi.string()
    .valid('percentage', 'fixed_amount', 'free_service', 'cashback', 'first_booking')
    .required(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),
  discountAmount: Joi.number().min(0).optional(),
  validityStartDate: Joi.date().iso().required(),
  validityEndDate: Joi.date().iso().required(),
  validityStartTime: Joi.string().pattern(/^\d{1,2}:\d{2}$/).optional(),
  validityEndTime: Joi.string().pattern(/^\d{1,2}:\d{2}$/).optional(),
  status: Joi.string().valid('draft', 'active', 'scheduled', 'expired', 'disabled').optional(),
  usageLimitType: Joi.string().valid('unlimited', 'total', 'per_customer').optional(),
  totalUsageLimit: Joi.number().integer().min(1).optional(),
  perCustomerLimit: Joi.number().integer().min(1).optional(),
  minBookingAmount: Joi.number().min(0).optional(),
  maxBookingAmount: Joi.number().min(0).optional(),
  customerEligibility: Joi.string()
    .valid('all', 'new', 'existing', 'premium', 'specific')
    .optional(),
  eligibleCustomerIds: Joi.array().items(objectId).optional(),
  serviceRestrictionType: Joi.string()
    .valid('all', 'categories', 'subcategories', 'services')
    .optional(),
  categoryIds: Joi.array().items(objectId).optional(),
  subcategoryIds: Joi.array().items(objectId).optional(),
  serviceIds: Joi.array().items(objectId).optional(),
  vendorRestrictionType: Joi.string().valid('all', 'selected').optional(),
  businessIds: Joi.array().items(objectId).optional(),
  locationRestrictionType: Joi.string().valid('all', 'cities', 'areas').optional(),
  cityNames: Joi.array().items(Joi.string()).optional(),
  areaNames: Joi.array().items(Joi.string()).optional(),
  autoApplyMode: Joi.string().valid('manual', 'best').optional(),
  businessId: objectId.optional(),
};

export const createCouponSchema = Joi.object(couponBaseSchema);

export const updateCouponSchema = Joi.object(
  Object.fromEntries(
    Object.entries(couponBaseSchema).map(([key, schema]) => [key, (schema as Joi.Schema).optional()]),
  ),
);

export const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  businessId: objectId.required(),
  subtotal: Joi.number().min(0).required(),
  serviceIds: Joi.array().items(objectId).default([]),
  categoryIds: Joi.array().items(objectId).default([]),
  subcategoryIds: Joi.array().items(objectId).default([]),
  cityName: Joi.string().optional(),
  areaName: Joi.string().optional(),
  autoApply: Joi.boolean().optional(),
});

export class CouponController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await CouponService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.getById(req, String(req.params.id));
      sendSuccess(res, coupon);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.create(req, req.body);
      sendCreated(res, coupon);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.update(req, String(req.params.id), req.body);
      sendSuccess(res, coupon, 'Coupon updated');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CouponService.remove(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.duplicate(req, String(req.params.id));
      sendCreated(res, coupon);
    } catch (e) {
      next(e);
    }
  }

  static async disable(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.disable(req, String(req.params.id));
      sendSuccess(res, coupon, 'Coupon disabled');
    } catch (e) {
      next(e);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const { code, businessId, subtotal, serviceIds, categoryIds, subcategoryIds, cityName, areaName, autoApply } = req.body;

      if (autoApply) {
        const best = await CouponService.findBestCoupon(
          customerId,
          businessId,
          subtotal,
          serviceIds,
          categoryIds,
          subcategoryIds,
          cityName,
          areaName,
        );
        if (!best) {
          sendSuccess(res, { valid: false, message: 'No applicable coupon found' });
          return;
        }
        sendSuccess(res, {
          valid: true,
          code: best.coupon.code,
          discountAmount: best.discountAmount,
          discountType: best.discountType,
          cashbackAmount: best.cashbackAmount,
          displayValue: CouponService.getDisplayValue(best.coupon),
          message: best.message,
        });
        return;
      }

      const result = await CouponService.validateCoupon({
        code,
        customerId,
        businessId,
        subtotal,
        serviceIds,
        categoryIds,
        subcategoryIds,
        cityName,
        areaName,
      });

      sendSuccess(res, {
        valid: true,
        code: result.coupon.code,
        discountAmount: result.discountAmount,
        discountType: result.discountType,
        cashbackAmount: result.cashbackAmount,
        displayValue: CouponService.getDisplayValue(result.coupon),
        message: result.message,
      });
    } catch (e) {
      next(e);
    }
  }

  static async available(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.query.businessId as string | undefined;
      const items = await CouponService.listAvailableForCustomer(req, businessId);
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  }

  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await CouponService.getStats(req);
      sendSuccess(res, stats);
    } catch (e) {
      next(e);
    }
  }
}

export const couponValidators = {
  create: validate(createCouponSchema),
  update: validate(updateCouponSchema),
  validate: validate(validateCouponSchema),
};
