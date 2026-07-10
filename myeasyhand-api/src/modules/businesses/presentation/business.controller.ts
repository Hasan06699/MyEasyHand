import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BusinessService } from '../application/business.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

export const createBusinessSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    zip: Joi.string(),
  }).optional(),
});

export const updateBusinessSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().allow(''),
  logo: Joi.string().uri().optional().allow(''),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow(''),
  }).optional(),
});

export class BusinessController {
  static async listPublic(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await BusinessService.listPublic();
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await BusinessService.getBySlug(String(req.params.slug));
      sendSuccess(res, business);
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await BusinessService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const business = await BusinessService.getById(id, req);
      sendSuccess(res, business);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const business = await BusinessService.create(req.body, req.user!.id);
      sendCreated(res, business);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const business = await BusinessService.update(id, req.body, req);
      sendSuccess(res, business, 'Business updated');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await BusinessService.remove(id, req);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export const businessValidators = {
  create: validate(createBusinessSchema),
  update: validate(updateBusinessSchema),
};
