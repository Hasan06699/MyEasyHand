import { Types } from 'mongoose';
import { Request } from 'express';
import { ServiceFeatureRequest } from '../../../database/models/service-feature-request.model';
import { Service } from '../../../database/models/service.model';
import { Business } from '../../../database/models/business.model';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { AuditLogService } from '../../audit/application/audit-log.service';

export class ServiceFeatureRequestService {
  private static assertBusinessOwner(req: Request): void {
    if (!req.user?.roles.includes('business_owner') || !req.user.businessId) {
      throw new ForbiddenError('Only business owners can submit feature requests');
    }
  }

  private static assertSuperAdmin(req: Request): void {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can perform this action');
    }
  }

  static async list(req: Request) {
    const filter: Record<string, unknown> = {};

    if (req.user?.roles.includes('super_admin')) {
      if (req.query.status) filter.status = req.query.status;
    } else if (req.user?.roles.includes('business_owner') && req.user.businessId) {
      filter.businessId = req.user.businessId;
      if (req.query.status) filter.status = req.query.status;
    } else {
      throw new ForbiddenError();
    }

    return ServiceFeatureRequest.find(filter)
      .populate('serviceId', 'name slug image')
      .populate('ownerId', 'firstName lastName email')
      .populate('businessId', 'name slug')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async create(req: Request, data: { serviceId: string; requestType: 'featured' | 'popular'; remarks?: string }) {
    this.assertBusinessOwner(req);

    const service = await Service.findOne({
      _id: data.serviceId,
      businessId: req.user!.businessId,
      isDeleted: false,
    });
    if (!service) throw new NotFoundError('Service not found');

    const business = await Business.findById(req.user!.businessId);
    if (!business) throw new NotFoundError('Business not found');

    const existing = await ServiceFeatureRequest.findOne({
      serviceId: data.serviceId,
      requestType: data.requestType,
      status: 'pending',
    });
    if (existing) {
      throw new ConflictError(`A pending ${data.requestType} request already exists for this service`);
    }

    const request = await ServiceFeatureRequest.create({
      serviceId: service._id,
      ownerId: new Types.ObjectId(req.user!.id),
      businessId: business._id,
      requestType: data.requestType,
      status: 'pending',
      remarks: data.remarks,
    });

    await AuditLogService.log({
      req,
      ownerId: req.user!.id,
      businessId: business._id.toString(),
      module: 'service_feature_request',
      action: 'request_submitted',
      resourceId: request._id.toString(),
      approvalStatus: 'pending',
      remarks: data.remarks,
      metadata: { requestType: data.requestType, serviceId: data.serviceId },
    });

    return request;
  }

  static async approve(req: Request, id: string, remarks?: string) {
    this.assertSuperAdmin(req);

    const request = await ServiceFeatureRequest.findById(id);
    if (!request) throw new NotFoundError('Feature request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be approved');
    }

    const updateField = request.requestType === 'featured' ? 'isFeatured' : 'isPopular';
    await Service.findByIdAndUpdate(request.serviceId, { [updateField]: true });

    request.status = 'approved';
    request.approvedBy = new Types.ObjectId(req.user!.id);
    request.approvedAt = new Date();
    if (remarks) request.remarks = remarks;
    await request.save();

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId: request.ownerId.toString(),
      businessId: request.businessId.toString(),
      module: 'service_feature_request',
      action: 'request_approved',
      resourceId: request._id.toString(),
      approvalStatus: 'approved',
      remarks,
      metadata: { requestType: request.requestType, serviceId: request.serviceId.toString() },
    });

    return request;
  }

  static async reject(req: Request, id: string, remarks?: string) {
    this.assertSuperAdmin(req);

    const request = await ServiceFeatureRequest.findById(id);
    if (!request) throw new NotFoundError('Feature request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be rejected');
    }

    request.status = 'rejected';
    request.approvedBy = new Types.ObjectId(req.user!.id);
    request.approvedAt = new Date();
    if (remarks) request.remarks = remarks;
    await request.save();

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId: request.ownerId.toString(),
      businessId: request.businessId.toString(),
      module: 'service_feature_request',
      action: 'request_rejected',
      resourceId: request._id.toString(),
      approvalStatus: 'rejected',
      remarks,
      metadata: { requestType: request.requestType, serviceId: request.serviceId.toString() },
    });

    return request;
  }
}
