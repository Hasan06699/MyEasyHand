import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { SubscriptionService } from '../application/subscription.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';
import { SubscriptionStatus } from '../../../database/models/subscription.model';

export const assignSubscriptionSchema = Joi.object({
  businessId: Joi.string().required(),
  planId: Joi.string().required(),
  status: Joi.string().valid('trial', 'active', 'past_due', 'cancelled', 'expired').optional(),
  startDate: Joi.date().optional(),
  expiresAt: Joi.date().optional(),
  notes: Joi.string().optional(),
});

export const updateSubscriptionSchema = Joi.object({
  planId: Joi.string().optional(),
  status: Joi.string().valid('trial', 'active', 'past_due', 'cancelled', 'expired').optional(),
  startDate: Joi.date().optional(),
  expiresAt: Joi.date().optional(),
  notes: Joi.string().optional(),
});

export class SubscriptionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        status: req.query.status as SubscriptionStatus | undefined,
        businessId: req.query.businessId as string | undefined,
      };
      const { items, meta } = await SubscriptionService.list(req, page, limit, filters);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.getMySubscription(req);
      sendSuccess(res, subscription);
    } catch (e) {
      next(e);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await SubscriptionService.getStatus(req);
      sendSuccess(res, status);
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.getById(String(req.params.id), req);
      sendSuccess(res, subscription);
    } catch (e) {
      next(e);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.assign(req.body);
      sendCreated(res, subscription);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.update(String(req.params.id), req.body, req);
      sendSuccess(res, subscription, 'Subscription updated');
    } catch (e) {
      next(e);
    }
  }

  static async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.renew(String(req.params.id), req);
      sendSuccess(res, subscription, 'Subscription renewed');
    } catch (e) {
      next(e);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionService.cancel(String(req.params.id), req);
      sendSuccess(res, subscription, 'Subscription cancelled');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.remove(String(req.params.id), req);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export const subscriptionValidators = {
  assign: validate(assignSubscriptionSchema),
  update: validate(updateSubscriptionSchema),
};
