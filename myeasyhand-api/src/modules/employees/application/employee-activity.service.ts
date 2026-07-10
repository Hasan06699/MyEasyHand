import { Types } from 'mongoose';
import { Request } from 'express';
import {
  EmployeeActivity,
  EmployeeActivityType,
} from '../../../database/models/employee-activity.model';

export type ActivityLogInput = {
  employeeId: string | Types.ObjectId;
  businessId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  type: EmployeeActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: string | Types.ObjectId;
  req?: Request;
};

export class EmployeeActivityService {
  static async log(input: ActivityLogInput): Promise<void> {
    const performedBy =
      input.performedBy ??
      (input.req?.user?.id ? new Types.ObjectId(input.req.user.id) : undefined);

    await EmployeeActivity.create({
      employeeId: new Types.ObjectId(input.employeeId),
      businessId: new Types.ObjectId(input.businessId),
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      description: input.description,
      metadata: input.metadata,
      performedBy,
    });
  }

  static async list(employeeId: string, page = 1, limit = 20) {
    const filter = { employeeId: new Types.ObjectId(employeeId) };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      EmployeeActivity.find(filter)
        .populate('performedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      EmployeeActivity.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }
}
