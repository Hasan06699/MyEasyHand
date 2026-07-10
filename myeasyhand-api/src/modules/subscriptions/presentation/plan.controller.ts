import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { PlanService } from '../application/plan.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const planLimitsSchema = Joi.object({
  maxEmployees: Joi.number().integer().min(0).required(),
  maxServices: Joi.number().integer().min(0).required(),
  maxBanners: Joi.number().integer().min(0).optional(),
  maxServiceRows: Joi.number().integer().min(0).optional(),
  maxBookingsPerMonth: Joi.number().integer().min(0).optional(),
});

export const createPlanSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  billingCycle: Joi.string().valid('monthly', 'yearly').optional(),
  durationDays: Joi.number().integer().min(1).required(),
  limits: planLimitsSchema.required(),
  features: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().optional(),
});

export const updatePlanSchema = createPlanSchema.fork(
  ['name', 'price', 'durationDays', 'limits'],
  (schema) => schema.optional(),
);

export class PlanController {
  static async listPublic(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PlanService.listPublic();
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await PlanService.listAdmin(page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlanService.getById(String(req.params.id));
      sendSuccess(res, plan);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlanService.create(req.body);
      sendCreated(res, plan);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlanService.update(String(req.params.id), req.body);
      sendSuccess(res, plan, 'Plan updated');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PlanService.remove(String(req.params.id));
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export const planValidators = {
  create: validate(createPlanSchema),
  update: validate(updatePlanSchema),
};
