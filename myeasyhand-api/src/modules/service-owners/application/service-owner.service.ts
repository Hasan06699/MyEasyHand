import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import { Business } from '../../../database/models/business.model';
import { User } from '../../../database/models/user.model';
import { Service } from '../../../database/models/service.model';
import { ServiceOwnerSettings } from '../../../database/models/service-owner-settings.model';
import { BusinessDocument } from '../../../database/models/business-document.model';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { AuditLogService } from '../../audit/application/audit-log.service';
import { ServiceOwnerSettingsService } from './service-owner-settings.service';
import { BusinessService } from '../../businesses/application/business.service';
import { TokenService } from '../../../services/otp.service';
import { SubscriptionAccessService } from '../../subscriptions/application/subscription-access.service';
import { SubscriptionService } from '../../subscriptions/application/subscription.service';

export type CreateServiceOwnerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
};

export type UpdateServiceOwnerInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  planId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
};

export type ServiceOwnerListItem = {
  _id: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
  };
  business: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    address?: { city?: string; state?: string; street?: string };
  };
  stats: {
    totalServices: number;
    activeServices: number;
    pendingServices: number;
    featuredServices: number;
    popularServices: number;
  };
  autoApproveServices: boolean;
  documentsApproved: number;
  documentsPending: number;
  subscription?: {
    _id: string;
    planId: string;
    planName: string;
    status: string;
    expiresAt: string;
  } | null;
};

export class ServiceOwnerService {
  private static assertSuperAdmin(req: Request): void {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can access service owners');
    }
  }

  static async create(req: Request, data: CreateServiceOwnerInput) {
    this.assertSuperAdmin(req);

    const existingUser = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false });
    if (existingUser) throw new ConflictError('Email already registered');

    const passwordHash = await TokenService.hashPassword(data.password);
    const owner = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleSlugs: ['business_owner'],
      isEmailVerified: true,
      status: 'active',
    });

    const business = await BusinessService.create(
      {
        name: data.businessName,
        email: (data.businessEmail || data.email).toLowerCase(),
        phone: data.businessPhone || data.phone,
        address: data.address,
      },
      owner._id.toString(),
    );

    await ServiceOwnerSettingsService.getOrCreate(owner._id.toString(), business._id.toString());

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId: owner._id.toString(),
      businessId: business._id.toString(),
      module: 'service_owner',
      action: 'create',
      resourceId: owner._id.toString(),
      metadata: { email: owner.email, businessName: business.name },
    });

    return { owner, business };
  }

  static async update(req: Request, ownerId: string, data: UpdateServiceOwnerInput) {
    this.assertSuperAdmin(req);

    const owner = await User.findOne({ _id: ownerId, roleSlugs: 'business_owner', isDeleted: false });
    if (!owner) throw new NotFoundError('Service owner not found');

    const business = await Business.findOne({ ownerId: owner._id, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    if (data.firstName) owner.firstName = data.firstName;
    if (data.lastName) owner.lastName = data.lastName;
    if (data.phone !== undefined) owner.phone = data.phone || undefined;
    if (data.status) {
      owner.status = data.status;
      business.status = data.status === 'active' ? 'active' : 'suspended';
    }
    await owner.save();

    if (data.businessName) business.name = data.businessName;
    if (data.businessEmail) business.email = data.businessEmail.toLowerCase();
    if (data.businessPhone !== undefined) business.phone = data.businessPhone || undefined;
    if (data.address) {
      business.address = { ...business.address, ...data.address };
    }
    await business.save();

    if (data.planId) {
      await this.changeOwnerPlan(req, business._id.toString(), data.planId);
    }

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId,
      businessId: business._id.toString(),
      module: 'service_owner',
      action: 'update',
      resourceId: ownerId,
      metadata: { fields: Object.keys(data) },
    });

    return { owner, business };
  }

  private static async changeOwnerPlan(req: Request, businessId: string, planId: string) {
    const subscription = await SubscriptionAccessService.getLatestForBusiness(businessId);

    if (subscription && SubscriptionAccessService.isValid(subscription)) {
      await SubscriptionService.update(
        subscription._id.toString(),
        { planId },
        req,
      );
      return;
    }

    await SubscriptionService.assign({ businessId, planId, status: 'active' });
  }

  static async resetPassword(req: Request, ownerId: string, password: string) {
    this.assertSuperAdmin(req);

    const owner = await User.findOne({ _id: ownerId, roleSlugs: 'business_owner', isDeleted: false }).select(
      '+passwordHash',
    );
    if (!owner) throw new NotFoundError('Service owner not found');

    owner.passwordHash = await TokenService.hashPassword(password);
    await owner.save();

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId,
      module: 'service_owner',
      action: 'password_reset',
      resourceId: ownerId,
    });

    return { message: 'Password reset successfully' };
  }

  static async list(req: Request, page = 1, limit = 20) {
    this.assertSuperAdmin(req);

    const businessFilter: FilterQuery<typeof Business> = { isDeleted: false };

    if (req.query.status) businessFilter.status = req.query.status;
    if (req.query.city) businessFilter['address.city'] = new RegExp(String(req.query.city), 'i');

    if (req.query.autoApprove === 'true' || req.query.autoApprove === 'false') {
      const enabled = req.query.autoApprove === 'true';
      const settings = await ServiceOwnerSettings.find({ autoApproveServices: enabled }).select('businessId');
      const businessIds = settings.map((s) => s.businessId);
      if (!enabled && businessIds.length === 0) {
        businessFilter._id = { $nin: [] };
      } else if (enabled) {
        businessFilter._id = { $in: businessIds };
      } else {
        businessFilter._id = { $nin: businessIds };
      }
    }

    if (req.query.search) {
      const search = String(req.query.search);
      const matchingOwners = await User.find({
        isDeleted: false,
        roleSlugs: 'business_owner',
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') },
        ],
      }).select('_id');
      businessFilter.ownerId = { $in: matchingOwners.map((o) => o._id) };
    }

    if (req.query.categoryId) {
      const categoryId = String(req.query.categoryId);
      const serviceBusinessIds = await Service.distinct('businessId', {
        isDeleted: false,
        $or: [{ parentCategoryId: categoryId }, { subCategoryId: categoryId }],
      });
      businessFilter._id = { $in: serviceBusinessIds };
    }

    const skip = (page - 1) * limit;
    const [businesses, total] = await Promise.all([
      Business.find(businessFilter)
        .populate('ownerId', 'firstName lastName email phone status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Business.countDocuments(businessFilter),
    ]);

    const items: ServiceOwnerListItem[] = await Promise.all(
      businesses.map(async (business) => {
        const owner = business.ownerId as unknown as {
          _id: Types.ObjectId;
          firstName: string;
          lastName: string;
          email: string;
          phone?: string;
          status: string;
        };

        const [stats, settings, docCounts, subscription] = await Promise.all([
          this.getServiceStats(business._id),
          ServiceOwnerSettings.findOne({ ownerId: owner._id }),
          this.getDocumentCounts(business._id),
          SubscriptionAccessService.getLatestForBusiness(business._id),
        ]);

        const plan = subscription?.planId as unknown as { _id?: Types.ObjectId; name?: string } | null;

        return {
          _id: owner._id.toString(),
          owner: {
            _id: owner._id.toString(),
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            phone: owner.phone,
            status: owner.status,
          },
          business: {
            _id: business._id.toString(),
            name: business.name,
            email: business.email,
            phone: business.phone,
            status: business.status,
            address: business.address,
          },
          stats,
          autoApproveServices: settings?.autoApproveServices ?? false,
          documentsApproved: docCounts.approved,
          documentsPending: docCounts.pending,
          subscription: subscription
            ? {
                _id: subscription._id.toString(),
                planId: plan?._id?.toString() ?? subscription.planId.toString(),
                planName: plan?.name ?? 'Unknown',
                status: subscription.status,
                expiresAt: subscription.expiresAt.toISOString(),
              }
            : null,
        };
      }),
    );

    return { items, meta: { page, limit, total } };
  }

  private static async getServiceStats(businessId: Types.ObjectId) {
    const base = { businessId, isDeleted: false };
    const [totalServices, activeServices, pendingServices, featuredServices, popularServices] = await Promise.all([
      Service.countDocuments(base),
      Service.countDocuments({ ...base, status: 'active' }),
      Service.countDocuments({ ...base, status: 'pending' }),
      Service.countDocuments({ ...base, isFeatured: true }),
      Service.countDocuments({ ...base, isPopular: true }),
    ]);

    return { totalServices, activeServices, pendingServices, featuredServices, popularServices };
  }

  private static async getDocumentCounts(businessId: Types.ObjectId) {
    const [approved, pending] = await Promise.all([
      BusinessDocument.countDocuments({ businessId, status: 'approved', isDeleted: false }),
      BusinessDocument.countDocuments({ businessId, status: 'pending', isDeleted: false }),
    ]);
    return { approved, pending };
  }

  static async getProfile(req: Request, ownerId: string) {
    this.assertSuperAdmin(req);

    const owner = await User.findOne({ _id: ownerId, roleSlugs: 'business_owner', isDeleted: false });
    if (!owner) throw new NotFoundError('Service owner not found');

    const business = await Business.findOne({ ownerId: owner._id, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    const [stats, settings, documents] = await Promise.all([
      this.getServiceStats(business._id),
      ServiceOwnerSettingsService.getOrCreate(owner._id.toString(), business._id.toString()),
      BusinessDocument.find({ businessId: business._id, isDeleted: false }).sort({ createdAt: -1 }),
    ]);

    return { owner, business, stats, settings, documents };
  }

  static async suspendOwner(req: Request, ownerId: string, remarks?: string) {
    this.assertSuperAdmin(req);
    return this.setOwnerStatus(req, ownerId, 'suspended', remarks);
  }

  static async activateOwner(req: Request, ownerId: string, remarks?: string) {
    this.assertSuperAdmin(req);
    return this.setOwnerStatus(req, ownerId, 'active', remarks);
  }

  private static async setOwnerStatus(
    req: Request,
    ownerId: string,
    status: 'active' | 'suspended',
    remarks?: string,
  ) {
    const owner = await User.findOne({ _id: ownerId, roleSlugs: 'business_owner', isDeleted: false });
    if (!owner) throw new NotFoundError('Service owner not found');

    owner.status = status;
    await owner.save();

    const business = await Business.findOne({ ownerId: owner._id, isDeleted: false });
    if (business) {
      business.status = status === 'active' ? 'active' : 'suspended';
      await business.save();
    }

    await AuditLogService.log({
      req,
      adminId: req.user!.id,
      ownerId,
      businessId: business?._id.toString(),
      module: 'service_owner',
      action: status === 'active' ? 'owner_activated' : 'owner_suspended',
      resourceId: ownerId,
      approvalStatus: status,
      remarks,
    });

    return { owner, business };
  }
}
