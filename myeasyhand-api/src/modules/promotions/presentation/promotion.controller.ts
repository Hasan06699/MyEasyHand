import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { PromotionService } from '../application/promotion.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const objectId = Joi.string().hex().length(24);

const locationEnum = Joi.string().valid(
  'home',
  'category',
  'search',
  'service_details',
  'campaign',
);

const platformEnum = Joi.string().valid('mobile_app', 'website', 'owner_dashboard');

const targetingFields = {
  platforms: Joi.array().items(platformEnum).optional(),
  locations: Joi.array().items(locationEnum).optional(),
  targetCountries: Joi.array().items(Joi.string()).optional(),
  targetStates: Joi.array().items(Joi.string()).optional(),
  targetCities: Joi.array().items(Joi.string()).optional(),
  customerTargetType: Joi.string().valid('all', 'new', 'existing', 'premium').optional(),
  targetCategoryIds: Joi.array().items(objectId).optional(),
  targetServiceIds: Joi.array().items(objectId).optional(),
};

const bannerBaseSchema = {
  name: Joi.string().required(),
  status: Joi.string().valid('draft', 'active', 'inactive').optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  priorityOrder: Joi.number().integer().min(0).optional(),
  bannerImageWeb: Joi.string().required(),
  bannerImageMobile: Joi.string().allow('').optional(),
  bannerTitle: Joi.string().allow('').optional(),
  bannerSubtitle: Joi.string().allow('').optional(),
  bannerType: Joi.string().valid('services', 'link', 'html', 'coupon').optional(),
  showImageOnly: Joi.boolean().optional(),
  textPosition: Joi.string()
    .valid(
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
      'left',
      'right',
    )
    .optional(),
  linkUrl: Joi.string().allow('').optional(),
  htmlContent: Joi.string().allow('').optional(),
  maxItems: Joi.number().integer().min(1).max(50).optional(),
  ctaButtonText: Joi.string().allow('').optional(),
  ctaButtonLink: Joi.string().allow('').optional(),
  couponId: objectId.optional().allow(null),
  bannerLayoutType: Joi.string().valid('standard', 'offer', 'html_landing').optional(),
  redirectionType: Joi.string()
    .valid('category', 'subcategory', 'service', 'external_url', 'custom_landing_page')
    .optional(),
  redirectionTargetId: objectId.optional().allow(null),
  redirectionUrl: Joi.string().allow('').optional(),
  serviceSourceType: Joi.string()
    .valid(
      'category',
      'subcategory',
      'selected_services',
      'featured',
      'best_selling',
      'top_rated',
      'new_services',
    )
    .optional(),
  categoryId: objectId.optional().allow(null),
  subcategoryId: objectId.optional().allow(null),
  serviceIds: Joi.array().items(objectId).optional(),
  businessId: objectId.optional(),
  ...targetingFields,
};

const serviceRowBackgroundSchema = Joi.object({
  type: Joi.string().valid('none', 'color', 'gradient', 'image', 'video').optional(),
  color: Joi.string().allow('').optional(),
  gradientStart: Joi.string().allow('').optional(),
  gradientEnd: Joi.string().allow('').optional(),
  gradientAngle: Joi.number().integer().min(0).max(360).optional(),
  imageUrl: Joi.string().allow('').optional(),
  imageUrlWeb: Joi.string().allow('').optional(),
  imageUrlMobile: Joi.string().allow('').optional(),
  videoSource: Joi.string().valid('upload', 'youtube').optional(),
  videoUrl: Joi.string().allow('').optional(),
  youtubeUrl: Joi.string().allow('').optional(),
  videoAutoplay: Joi.boolean().optional(),
  videoMuted: Joi.boolean().optional(),
});

const serviceRowSpacingSidesSchema = Joi.object({
  top: Joi.number().integer().min(0).optional(),
  bottom: Joi.number().integer().min(0).optional(),
  left: Joi.number().integer().min(0).optional(),
  right: Joi.number().integer().min(0).optional(),
});

const serviceRowSpacingByViewportSchema = Joi.object({
  web: serviceRowSpacingSidesSchema.optional(),
  mobile: serviceRowSpacingSidesSchema.optional(),
});

const serviceRowBaseSchema = {
  rowName: Joi.string().required(),
  displayOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'active', 'inactive').optional(),
  startDate: Joi.date().iso().optional().allow(null),
  endDate: Joi.date().iso().optional().allow(null),
  background: serviceRowBackgroundSchema.optional(),
  rowMargin: serviceRowSpacingByViewportSchema.optional(),
  rowPadding: serviceRowSpacingByViewportSchema.optional(),
  rowTitle: Joi.string().required(),
  rowSubtitle: Joi.string().allow('').optional(),
  serviceSourceType: Joi.string()
    .valid(
      'category',
      'subcategory',
      'selected_services',
      'featured',
      'best_selling',
      'top_rated',
      'new_services',
    )
    .required(),
  categoryId: objectId.optional().allow(null),
  subcategoryId: objectId.optional().allow(null),
  serviceIds: Joi.array().items(objectId).optional(),
  maxItems: Joi.number().integer().min(1).max(50).optional(),
  businessId: objectId.optional(),
  ...targetingFields,
};

const trackEventSchema = Joi.object({
  entityType: Joi.string().valid('banner', 'service_row').required(),
  entityId: objectId.required(),
  eventType: Joi.string()
    .valid('view', 'click', 'coupon_use', 'booking_conversion')
    .required(),
  businessId: objectId.optional(),
  couponId: objectId.optional(),
  bookingId: objectId.optional(),
  revenue: Joi.number().min(0).optional(),
  metadata: Joi.object().optional(),
});

const promotionApprovalSchema = Joi.object({
  remarks: Joi.string().allow('').optional(),
});

export const promotionValidators = {
  createBanner: validate(Joi.object(bannerBaseSchema)),
  updateBanner: validate(
    Joi.object(
      Object.fromEntries(
        Object.entries(bannerBaseSchema).map(([key, schema]) => [
          key,
          (schema as Joi.Schema).optional(),
        ]),
      ),
    ),
  ),
  createServiceRow: validate(Joi.object(serviceRowBaseSchema)),
  updateServiceRow: validate(
    Joi.object(
      Object.fromEntries(
        Object.entries(serviceRowBaseSchema).map(([key, schema]) => [
          key,
          key === 'serviceSourceType'
            ? (schema as Joi.Schema).optional()
            : (schema as Joi.Schema).optional(),
        ]),
      ),
    ),
  ),
  trackEvent: validate(trackEventSchema),
  approvePromotion: validate(promotionApprovalSchema),
  rejectPromotion: validate(promotionApprovalSchema),
};

export class PromotionController {
  // Banners
  static async listBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await PromotionService.listBanners(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.getBannerById(req, String(req.params.id));
      sendSuccess(res, banner);
    } catch (e) {
      next(e);
    }
  }

  static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.createBanner(req, req.body);
      sendCreated(res, banner);
    } catch (e) {
      next(e);
    }
  }

  static async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.updateBanner(req, String(req.params.id), req.body);
      sendSuccess(res, banner, 'Banner updated');
    } catch (e) {
      next(e);
    }
  }

  static async submitBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.submitBannerForReview(req, String(req.params.id));
      sendSuccess(res, banner, 'Banner submitted for review');
    } catch (e) {
      next(e);
    }
  }

  static async removeBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromotionService.removeBanner(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async approveBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.approveBanner(
        req,
        String(req.params.id),
        req.body.remarks,
      );
      sendSuccess(res, banner, 'Banner approved');
    } catch (e) {
      next(e);
    }
  }

  static async rejectBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.rejectBanner(
        req,
        String(req.params.id),
        req.body.remarks,
      );
      sendSuccess(res, banner, 'Banner rejected');
    } catch (e) {
      next(e);
    }
  }

  static async activeBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await PromotionService.getActiveBanners({
        platform: req.query.platform as string,
        location: req.query.location as string,
        businessId: req.query.businessId as string,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
      });
      sendSuccess(res, banners);
    } catch (e) {
      next(e);
    }
  }

  static async activeBannerById(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await PromotionService.getActiveBannerById(String(req.params.id), {
        platform: req.query.platform as string,
        businessId: req.query.businessId as string,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
      });
      sendSuccess(res, banner);
    } catch (e) {
      next(e);
    }
  }

  // Service Rows
  static async listServiceRows(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await PromotionService.listServiceRows(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.getServiceRowWithServices(
        req,
        String(req.params.id),
        req.query.businessId as string,
      );
      sendSuccess(res, row);
    } catch (e) {
      next(e);
    }
  }

  static async createServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.createServiceRow(req, req.body);
      sendCreated(res, row);
    } catch (e) {
      next(e);
    }
  }

  static async updateServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.updateServiceRow(req, String(req.params.id), req.body);
      sendSuccess(res, row, 'Service row updated');
    } catch (e) {
      next(e);
    }
  }

  static async submitServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.submitServiceRowForReview(req, String(req.params.id));
      sendSuccess(res, row, 'Service row submitted for review');
    } catch (e) {
      next(e);
    }
  }

  static async removeServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromotionService.removeServiceRow(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async approveServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.approveServiceRow(
        req,
        String(req.params.id),
        req.body.remarks,
      );
      sendSuccess(res, row, 'Service row approved');
    } catch (e) {
      next(e);
    }
  }

  static async rejectServiceRow(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await PromotionService.rejectServiceRow(
        req,
        String(req.params.id),
        req.body.remarks,
      );
      sendSuccess(res, row, 'Service row rejected');
    } catch (e) {
      next(e);
    }
  }

  static async activeServiceRows(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await PromotionService.getActiveServiceRows({
        platform: req.query.platform as string,
        location: req.query.location as string,
        businessId: req.query.businessId as string,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
      });
      sendSuccess(res, rows);
    } catch (e) {
      next(e);
    }
  }

  // Analytics
  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await PromotionService.getStats(req);
      sendSuccess(res, stats);
    } catch (e) {
      next(e);
    }
  }

  static async trackEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromotionService.trackEvent({
        ...req.body,
        customerId: req.user?.id,
      });
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}
