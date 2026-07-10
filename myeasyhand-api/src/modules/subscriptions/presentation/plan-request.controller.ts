import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { PlanRequestService } from '../application/plan-request.service';
import { sendCreated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

export const createPlanRequestSchema = Joi.object({
  planId: Joi.string().required(),
  type: Joi.string().valid('activate', 'upgrade').required(),
  note: Joi.string().optional(),
});

export const reviewPlanRequestSchema = Joi.object({
  reviewNote: Joi.string().optional(),
});

export class PlanRequestController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PlanRequestService.list(req);
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await PlanRequestService.create(req, req.body);
      sendCreated(res, item);
    } catch (e) {
      next(e);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await PlanRequestService.approve(req, String(req.params.id), req.body.reviewNote);
      sendSuccess(res, item, 'Plan request approved');
    } catch (e) {
      next(e);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await PlanRequestService.reject(req, String(req.params.id), req.body.reviewNote);
      sendSuccess(res, item, 'Plan request rejected');
    } catch (e) {
      next(e);
    }
  }
}

export const planRequestValidators = {
  create: validate(createPlanRequestSchema),
  review: validate(reviewPlanRequestSchema),
};
