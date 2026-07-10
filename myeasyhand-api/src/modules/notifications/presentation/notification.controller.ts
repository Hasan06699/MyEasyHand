import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { NotificationService } from '../../../services/notification.service';
import { sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

export const sendNotificationSchema = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  type: Joi.string().optional(),
  userId: Joi.string().optional(),
  businessId: Joi.string().optional(),
  roleSlug: Joi.string().valid('super_admin', 'business_owner', 'employee', 'customer').optional(),
}).or('userId', 'businessId', 'roleSlug');

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await NotificationService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await NotificationService.listAdmin(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.unreadCount(req.user!.id);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.markRead(String(req.params.id), req.user!.id);
      sendSuccess(res, notification);
    } catch (e) {
      next(e);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllRead(req.user!.id);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.sendAdmin(req, req.body);
      sendSuccess(res, result, 'Notifications sent');
    } catch (e) {
      next(e);
    }
  }
}

export const notificationValidators = {
  send: validate(sendNotificationSchema),
};
