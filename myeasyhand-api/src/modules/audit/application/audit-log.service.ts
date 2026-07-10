import { Types } from 'mongoose';
import { Request } from 'express';
import { AuditLog } from '../../../database/models/audit-log.model';

export type AuditLogInput = {
  req?: Request;
  adminId?: string;
  ownerId?: string;
  businessId?: string;
  module: string;
  action: string;
  resourceId?: string;
  approvalStatus?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
};

export class AuditLogService {
  static async log(input: AuditLogInput): Promise<void> {
    const adminId = input.adminId ?? (input.req?.user?.roles.includes('super_admin') ? input.req.user.id : undefined);
    const ownerId = input.ownerId ?? (input.req?.user?.roles.includes('business_owner') ? input.req.user.id : undefined);

    await AuditLog.create({
      adminId: adminId ? new Types.ObjectId(adminId) : undefined,
      ownerId: ownerId ? new Types.ObjectId(ownerId) : undefined,
      businessId: input.businessId
        ? new Types.ObjectId(input.businessId)
        : input.req?.user?.businessId
          ? new Types.ObjectId(input.req.user.businessId)
          : undefined,
      module: input.module,
      action: input.action,
      resourceId: input.resourceId ? new Types.ObjectId(input.resourceId) : undefined,
      approvalStatus: input.approvalStatus,
      remarks: input.remarks,
      metadata: input.metadata,
    });
  }

  static async list(req: Request, page = 1, limit = 50) {
    const filter: Record<string, unknown> = {};

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    if (req.query.module) filter.module = req.query.module;
    if (req.query.ownerId) filter.ownerId = req.query.ownerId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('adminId', 'firstName lastName email')
        .populate('ownerId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AuditLog.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }
}
