import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { EmployeeService } from '../application/employee.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  phone: Joi.string().max(20).optional().allow(''),
  employeeType: Joi.string().valid('office_staff', 'service_staff').required(),
  designation: Joi.string().max(100).required(),
  department: Joi.string().max(100).optional().allow(''),
  hireDate: Joi.date().iso().optional().allow(null, ''),
  notes: Joi.string().max(1000).optional().allow(''),
  businessId: Joi.string().optional(),
});

const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional().allow(''),
  password: Joi.string().min(8).optional(),
  employeeType: Joi.string().valid('office_staff', 'service_staff').optional(),
  designation: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional().allow(''),
  hireDate: Joi.date().iso().optional().allow(null, ''),
  status: Joi.string().valid('active', 'on_leave', 'terminated').optional(),
  notes: Joi.string().max(1000).optional().allow(''),
});

const skillSchema = Joi.object({
  skillName: Joi.string().max(100).required(),
  serviceId: Joi.string().optional().allow(null, ''),
  proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'expert').optional(),
});

const updateSkillsSchema = Joi.object({
  skills: Joi.array().items(skillSchema).required(),
});

const availabilitySlotSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  isAvailable: Joi.boolean().optional(),
});

const updateAvailabilitySchema = Joi.object({
  availability: Joi.array().items(availabilitySlotSchema).required(),
});

export class EmployeeController {
  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await EmployeeService.getStats(req);
      sendSuccess(res, stats);
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await EmployeeService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async listServiceStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.query.businessId as string | undefined;
      const items = await EmployeeService.listServiceStaff(req, businessId);
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.getMe(req);
      sendSuccess(res, employee);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const employee = await EmployeeService.getById(req, id);
      sendSuccess(res, employee);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.create(req, req.body);
      sendCreated(res, employee, 'Employee created');
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const employee = await EmployeeService.update(req, id, req.body);
      sendSuccess(res, employee, 'Employee updated');
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await EmployeeService.delete(req, id);
      sendSuccess(res, result, 'Employee removed');
    } catch (e) {
      next(e);
    }
  }

  static async updateSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const skills = await EmployeeService.updateSkills(req, id, req.body.skills);
      sendSuccess(res, skills, 'Skills updated');
    } catch (e) {
      next(e);
    }
  }

  static async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const availability = await EmployeeService.updateAvailability(req, id, req.body.availability);
      sendSuccess(res, availability, 'Availability updated');
    } catch (e) {
      next(e);
    }
  }

  static async performance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await EmployeeService.getPerformance(req, id);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async activities(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, meta } = await EmployeeService.getActivities(req, id, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }
}

export const employeeValidators = {
  create: validate(createEmployeeSchema),
  update: validate(updateEmployeeSchema),
  updateSkills: validate(updateSkillsSchema),
  updateAvailability: validate(updateAvailabilitySchema),
};
