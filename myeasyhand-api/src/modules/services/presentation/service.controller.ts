import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ServiceModuleService } from '../application/service.service';
import { CategoryRequestService } from '../application/category-request.service';
import { ServiceFeatureRequestService } from '../application/service-feature-request.service';
import { ServiceGalleryService } from '../application/service-gallery.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const serviceFields = {
  name: Joi.string().max(255).required(),
  slug: Joi.string().max(255).optional(),
  parentCategoryId: Joi.string().required(),
  subCategoryId: Joi.string().optional().allow(null, ''),
  serviceCode: Joi.string().max(50).optional().allow(''),
  shortDescription: Joi.string().required(),
  fullDescription: Joi.string().optional().allow(''),
  icon: Joi.string().max(500).optional().allow(''),
  image: Joi.string().max(500).required(),
  basePrice: Joi.number().min(0).optional(),
  mrp: Joi.number().min(0).optional(),
  salePrice: Joi.number().min(0).optional(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  discountExpiresAt: Joi.date().iso().optional().allow(null, ''),
  priceType: Joi.string().valid('fixed', 'hourly', 'quote-based').required(),
  duration: Joi.number().min(1).optional(),
  durationUnit: Joi.string().valid('minute', 'hour', 'day').optional(),
  gstPercentage: Joi.number().min(0).max(100).optional(),
  isFeatured: Joi.boolean().optional(),
  isPopular: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive', 'draft', 'pending').optional(),
  displayOrder: Joi.number().min(0).optional(),
  metaTitle: Joi.string().max(255).optional().allow(''),
  metaKeywords: Joi.string().optional().allow(''),
  metaDescription: Joi.string().optional().allow(''),
  businessId: Joi.string().optional(),
  cityIds: Joi.array().items(Joi.string()).min(1).optional(),
};

const createServiceSchema = Joi.object(serviceFields);

const updateServiceSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  slug: Joi.string().max(255).optional(),
  parentCategoryId: Joi.string().optional(),
  subCategoryId: Joi.string().optional().allow(null, ''),
  serviceCode: Joi.string().max(50).optional().allow(''),
  shortDescription: Joi.string().optional(),
  fullDescription: Joi.string().optional().allow(''),
  icon: Joi.string().max(500).optional().allow(''),
  image: Joi.string().max(500).optional(),
  basePrice: Joi.number().min(0).optional().allow(null),
  mrp: Joi.number().min(0).optional().allow(null),
  salePrice: Joi.number().min(0).optional().allow(null),
  discountPercent: Joi.number().min(0).max(100).optional().allow(null),
  discountExpiresAt: Joi.date().iso().optional().allow(null, ''),
  priceType: Joi.string().valid('fixed', 'hourly', 'quote-based').optional(),
  duration: Joi.number().min(1).optional().allow(null),
  durationUnit: Joi.string().valid('minute', 'hour', 'day').optional().allow(null),
  gstPercentage: Joi.number().min(0).max(100).optional().allow(null),
  isFeatured: Joi.boolean().optional(),
  isPopular: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive', 'draft', 'pending').optional(),
  displayOrder: Joi.number().min(0).optional(),
  metaTitle: Joi.string().max(255).optional().allow(''),
  metaKeywords: Joi.string().optional().allow(''),
  metaDescription: Joi.string().optional().allow(''),
  businessId: Joi.string().optional(),
  cityIds: Joi.array().items(Joi.string()).min(1).optional(),
});

const createFeatureRequestSchema = Joi.object({
  serviceId: Joi.string().required(),
  requestType: Joi.string().valid('featured', 'popular').required(),
  remarks: Joi.string().optional().allow(''),
});

const reviewFeatureRequestSchema = Joi.object({
  remarks: Joi.string().optional().allow(''),
});

const galleryImageSchema = Joi.object({
  imagePath: Joi.string().required(),
  sortOrder: Joi.number().min(0).optional(),
});

const approveServiceSchema = Joi.object({
  remarks: Joi.string().optional().allow(''),
});

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  icon: Joi.string().optional().allow(''),
  image: Joi.string().optional().allow(''),
  sortOrder: Joi.number().min(0).optional(),
  parentId: Joi.string().optional().allow(null, ''),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  icon: Joi.string().optional().allow(''),
  image: Joi.string().optional().allow(''),
  sortOrder: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
  parentId: Joi.string().optional().allow(null, ''),
});

const createCategoryRequestSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  parentId: Joi.string().optional().allow(null, ''),
  icon: Joi.string().optional().allow(''),
  image: Joi.string().optional().allow(''),
  sortOrder: Joi.number().min(0).optional(),
});

const reviewCategoryRequestSchema = Joi.object({
  reviewNote: Joi.string().optional().allow(''),
});

export class ServiceController {
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ServiceModuleService.listCategories(req);
      sendSuccess(res, categories);
    } catch (e) {
      next(e);
    }
  }

  static async listCategoryRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await CategoryRequestService.list(req);
      sendSuccess(res, requests);
    } catch (e) {
      next(e);
    }
  }

  static async createCategoryRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await CategoryRequestService.create(req, req.body);
      sendCreated(res, request, 'Category request submitted');
    } catch (e) {
      next(e);
    }
  }

  static async approveCategoryRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryRequestService.approve(req, String(req.params.id), req.body.reviewNote);
      sendSuccess(res, result, 'Category request approved and category is now live');
    } catch (e) {
      next(e);
    }
  }

  static async rejectCategoryRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await CategoryRequestService.reject(req, String(req.params.id), req.body.reviewNote);
      sendSuccess(res, request, 'Category request rejected');
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await ServiceModuleService.listServices(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceModuleService.createService(req, req.body);
      sendCreated(res, service);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceModuleService.updateService(req, String(req.params.id), req.body);
      sendSuccess(res, service, 'Service updated');
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceModuleService.deleteService(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await ServiceModuleService.createCategory(req, req.body);
      sendCreated(res, category);
    } catch (e) {
      next(e);
    }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await ServiceModuleService.getCategoryById(String(req.params.id));
      sendSuccess(res, category);
    } catch (e) {
      next(e);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await ServiceModuleService.updateCategory(req, String(req.params.id), req.body);
      sendSuccess(res, category, 'Category updated');
    } catch (e) {
      next(e);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceModuleService.deleteCategory(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceModuleService.getById(String(req.params.id));
      sendSuccess(res, service);
    } catch (e) {
      next(e);
    }
  }

  static async approveService(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceModuleService.approveService(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, service, 'Service approved and published');
    } catch (e) {
      next(e);
    }
  }

  static async listFeatureRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await ServiceFeatureRequestService.list(req);
      sendSuccess(res, requests);
    } catch (e) {
      next(e);
    }
  }

  static async createFeatureRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await ServiceFeatureRequestService.create(req, req.body);
      sendCreated(res, request, 'Feature request submitted');
    } catch (e) {
      next(e);
    }
  }

  static async approveFeatureRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await ServiceFeatureRequestService.approve(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, request, 'Feature request approved');
    } catch (e) {
      next(e);
    }
  }

  static async rejectFeatureRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await ServiceFeatureRequestService.reject(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, request, 'Feature request rejected');
    } catch (e) {
      next(e);
    }
  }

  static async addGalleryImage(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ServiceGalleryService.addImage(
        req,
        String(req.params.id),
        req.body.imagePath,
        req.body.sortOrder,
      );
      sendCreated(res, item, 'Gallery image added');
    } catch (e) {
      next(e);
    }
  }

  static async removeGalleryImage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceGalleryService.removeImage(req, String(req.params.galleryId));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export const serviceValidators = {
  create: validate(createServiceSchema),
  update: validate(updateServiceSchema),
  createCategory: validate(createCategorySchema),
  updateCategory: validate(updateCategorySchema),
  createCategoryRequest: validate(createCategoryRequestSchema),
  reviewCategoryRequest: validate(reviewCategoryRequestSchema),
  createFeatureRequest: validate(createFeatureRequestSchema),
  reviewFeatureRequest: validate(reviewFeatureRequestSchema),
  galleryImage: validate(galleryImageSchema),
  approveService: validate(approveServiceSchema),
};
