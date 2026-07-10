import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CustomerService } from '../application/customer.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const createCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  phone: Joi.string().max(20).optional().allow(''),
});

const updateCustomerSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  password: Joi.string().min(8).optional(),
});

const viewCustomerPasswordSchema = Joi.object({
  adminPassword: Joi.string().required(),
});

export class CustomerController {
  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await CustomerService.getStats(req);
      sendSuccess(res, stats);
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await CustomerService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const customer = await CustomerService.getById(req, id);
      sendSuccess(res, customer);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.create(req, req.body);
      sendCreated(res, customer, 'Customer created');
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const customer = await CustomerService.update(req, id, req.body);
      sendSuccess(res, customer, 'Customer updated');
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await CustomerService.delete(req, id);
      sendSuccess(res, result, 'Customer removed');
    } catch (e) {
      next(e);
    }
  }

  static async viewPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await CustomerService.viewPassword(req, id, req.body.adminPassword);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }
}

export const customerValidators = {
  create: validate(createCustomerSchema),
  update: validate(updateCustomerSchema),
  viewPassword: validate(viewCustomerPasswordSchema),
};
