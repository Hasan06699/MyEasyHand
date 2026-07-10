import { Types } from 'mongoose';
import { Request } from 'express';
import { ServiceOwnerSettings } from '../../../database/models/service-owner-settings.model';
import { Business } from '../../../database/models/business.model';
import { User } from '../../../database/models/user.model';
import { ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { AuditLogService } from '../../audit/application/audit-log.service';

export class ServiceOwnerSettingsService {
  static async getOrCreate(ownerId: string, businessId: string) {
    let settings = await ServiceOwnerSettings.findOne({ ownerId });
    if (!settings) {
      settings = await ServiceOwnerSettings.create({
        ownerId: new Types.ObjectId(ownerId),
        businessId: new Types.ObjectId(businessId),
        autoApproveServices: false,
      });
    }
    return settings;
  }

  static async getByOwnerId(ownerId: string) {
    return ServiceOwnerSettings.findOne({ ownerId });
  }

  static async setAutoApprove(req: Request, ownerId: string, enabled: boolean) {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can change auto approval settings');
    }

    const owner = await User.findOne({ _id: ownerId, roleSlugs: 'business_owner', isDeleted: false });
    if (!owner) throw new NotFoundError('Service owner not found');

    const business = await Business.findOne({ ownerId: owner._id, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found for owner');

    const settings = await ServiceOwnerSettings.findOneAndUpdate(
      { ownerId: owner._id },
      {
        ownerId: owner._id,
        businessId: business._id,
        autoApproveServices: enabled,
        updatedBy: new Types.ObjectId(req.user.id),
      },
      { upsert: true, new: true },
    );

    await AuditLogService.log({
      req,
      adminId: req.user.id,
      ownerId,
      businessId: business._id.toString(),
      module: 'service_owner_settings',
      action: enabled ? 'auto_approve_enabled' : 'auto_approve_disabled',
      resourceId: settings._id.toString(),
      approvalStatus: enabled ? 'enabled' : 'disabled',
      metadata: { autoApproveServices: enabled },
    });

    return settings;
  }

  static async isAutoApproveEnabled(ownerId: string): Promise<boolean> {
    const settings = await ServiceOwnerSettings.findOne({ ownerId });
    return settings?.autoApproveServices ?? false;
  }
}
