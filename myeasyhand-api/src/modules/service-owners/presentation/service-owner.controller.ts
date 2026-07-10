import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ServiceOwnerService } from '../application/service-owner.service';
import { ServiceOwnerSettingsService } from '../application/service-owner-settings.service';
import { BusinessDocumentService } from '../application/business-document.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const reviewSchema = Joi.object({
  remarks: Joi.string().optional().allow(''),
});

const autoApproveSchema = Joi.object({
  enabled: Joi.boolean().required(),
});

const documentUploadSchema = Joi.object({
  type: Joi.string().required(),
  filePath: Joi.string().required(),
  fileName: Joi.string().required(),
  category: Joi.string().valid('identity', 'business', 'bank', 'address', 'employee').optional(),
  expiresAt: Joi.date().iso().optional().allow(null, ''),
});

const createOwnerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  phone: Joi.string().max(20).optional().allow(''),
  businessName: Joi.string().max(200).required(),
  businessEmail: Joi.string().email().optional(),
  businessPhone: Joi.string().max(20).optional().allow(''),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow(''),
  }).optional(),
});

const updateOwnerSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  businessName: Joi.string().max(200).optional(),
  businessEmail: Joi.string().email().optional(),
  businessPhone: Joi.string().max(20).optional().allow(''),
  planId: Joi.string().hex().length(24).optional(),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow(''),
  }).optional(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
});

export class ServiceOwnerController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceOwnerService.create(req, req.body);
      sendCreated(res, result, 'Service owner created');
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await ServiceOwnerService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ServiceOwnerService.getProfile(req, String(req.params.id));
      sendSuccess(res, profile);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceOwnerService.update(req, String(req.params.id), req.body);
      sendSuccess(res, result, 'Service owner updated');
    } catch (e) {
      next(e);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceOwnerService.resetPassword(
        req,
        String(req.params.id),
        req.body.password,
      );
      sendSuccess(res, result, 'Password reset successfully');
    } catch (e) {
      next(e);
    }
  }

  static async setAutoApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await ServiceOwnerSettingsService.setAutoApprove(
        req,
        String(req.params.id),
        req.body.enabled,
      );
      sendSuccess(res, settings, 'Auto approval setting updated');
    } catch (e) {
      next(e);
    }
  }

  static async suspend(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceOwnerService.suspendOwner(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, result, 'Owner suspended');
    } catch (e) {
      next(e);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ServiceOwnerService.activateOwner(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, result, 'Owner activated');
    } catch (e) {
      next(e);
    }
  }

  static async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await BusinessDocumentService.list(req);
      sendSuccess(res, documents);
    } catch (e) {
      next(e);
    }
  }

  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await BusinessDocumentService.upload(req, req.body);
      sendSuccess(res, doc, 'Document submitted for review');
    } catch (e) {
      next(e);
    }
  }

  static async approveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await BusinessDocumentService.approve(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, doc, 'Document approved');
    } catch (e) {
      next(e);
    }
  }

  static async rejectDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await BusinessDocumentService.reject(req, String(req.params.id), req.body.remarks);
      sendSuccess(res, doc, 'Document rejected');
    } catch (e) {
      next(e);
    }
  }
}

export const serviceOwnerValidators = {
  create: validate(createOwnerSchema),
  update: validate(updateOwnerSchema),
  resetPassword: validate(resetPasswordSchema),
  review: validate(reviewSchema),
  autoApprove: validate(autoApproveSchema),
  documentUpload: validate(documentUploadSchema),
};
