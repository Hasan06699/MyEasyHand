import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import {
  PromotionBanner,
  IPromotionBanner,
  PromotionStatus,
  PromotionApprovalStatus,
  BannerType,
} from '../../../database/models/promotion-banner.model';
import {
  ServiceRow,
  IServiceRow,
  ServiceRowSourceType,
} from '../../../database/models/service-row.model';
import {
  PromotionEvent,
  PromotionEntityType,
  PromotionEventType,
} from '../../../database/models/promotion-event.model';
import { Service, IService } from '../../../database/models/service.model';
import { Business } from '../../../database/models/business.model';
import { Booking } from '../../../database/models/booking.model';
import { Review } from '../../../database/models/review.model';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../common/errors/AppError';
import { PlanLimitService } from '../../subscriptions/application/plan-limit.service';
import { NotificationService } from '../../../services/notification.service';
import { User } from '../../../database/models/user.model';

const OWNER_BANNER_TYPES: BannerType[] = ['services', 'coupon'];

const BUSINESS_POPULATE = {
  path: 'businessId',
  select: 'name slug ownerId',
  populate: { path: 'ownerId', select: 'firstName lastName email' },
};

const SERVICE_CARD_SELECT =
  'name slug image parentCategoryId subCategoryId mrp salePrice basePrice discountPercent isFeatured status';

function resolveBannerStatus(banner: IPromotionBanner, now = new Date()): PromotionStatus {
  if (banner.approvalStatus !== 'approved') return 'draft';
  if (banner.status === 'draft' || banner.status === 'inactive') return banner.status;
  if (now < banner.startDate) return 'inactive';
  if (now > banner.endDate) return 'inactive';
  return banner.status;
}

function resolveServiceRowStatus(row: IServiceRow, now = new Date()): PromotionStatus {
  if (row.approvalStatus !== 'approved') return 'draft';
  const status = row.status ?? (row.isActive ? 'active' : 'inactive');
  if (status === 'draft' || status === 'inactive') return status;
  if (row.startDate && now < row.startDate) return 'inactive';
  if (row.endDate && now > row.endDate) return 'inactive';
  return status;
}

function syncServiceRowActiveFlag(data: Record<string, unknown>): void {
  if (data.status !== undefined) {
    data.isActive = data.status === 'active';
  }
}

export class PromotionService {
  private static isAdmin(req: Request): boolean {
    const roles = req.user?.roles ?? [];
    return roles.includes('super_admin') || roles.includes('business_owner');
  }

  private static canManage(req: Request): boolean {
    return (
      req.user?.permissions?.includes('promotions.manage') ||
      req.user?.roles.includes('super_admin') ||
      false
    );
  }

  private static getTenantFilter(req: Request): FilterQuery<{ businessId?: Types.ObjectId | null }> {
    if (req.user?.roles.includes('super_admin')) return {};
    if (req.user?.businessId) {
      return { businessId: new Types.ObjectId(req.user.businessId) };
    }
    return {};
  }

  private static assertEntityAccess(
    req: Request,
    entity: { businessId?: Types.ObjectId | null },
  ) {
    if (req.user?.roles.includes('super_admin')) return;
    if (
      entity.businessId &&
      req.user?.businessId &&
      entity.businessId.toString() === req.user.businessId
    ) {
      return;
    }
    if (!entity.businessId && req.user?.roles.includes('business_owner')) {
      throw new ForbiddenError('Platform promotions are read-only for business owners');
    }
    throw new ForbiddenError();
  }

  private static applyBusinessIdOnCreate(req: Request, data: { businessId?: string }) {
    if (req.user?.roles.includes('super_admin')) {
      return data.businessId ? new Types.ObjectId(data.businessId) : undefined;
    }
    if (req.user?.businessId) {
      return new Types.ObjectId(req.user.businessId);
    }
    return undefined;
  }

  private static isSuperAdmin(req: Request): boolean {
    return req.user?.roles.includes('super_admin') ?? false;
  }

  private static isBusinessOwnerOnly(req: Request): boolean {
    return (
      req.user?.roles.includes('business_owner') === true &&
      !req.user?.roles.includes('super_admin')
    );
  }

  private static assertOwnerBannerType(req: Request, bannerType?: BannerType): void {
    if (!this.isBusinessOwnerOnly(req)) return;
    if (bannerType && !OWNER_BANNER_TYPES.includes(bannerType)) {
      throw new ValidationError('Business owners can only create services or coupon banners');
    }
  }

  private static applyOwnerApprovalOnCreate(
    req: Request,
    data: Record<string, unknown>,
  ): { approvalStatus: PromotionApprovalStatus; requestedStatus?: PromotionStatus; status: PromotionStatus } {
    if (!this.isBusinessOwnerOnly(req)) {
      return {
        approvalStatus: 'approved',
        status: (data.status as PromotionStatus) ?? 'draft',
      };
    }

    const requestedStatus = (data.status as PromotionStatus) ?? 'draft';
    return {
      approvalStatus: 'draft',
      requestedStatus,
      status: 'draft',
    };
  }

  private static applyOwnerApprovalOnUpdate(
    req: Request,
    data: Record<string, unknown>,
    current: { approvalStatus?: PromotionApprovalStatus; status: PromotionStatus; requestedStatus?: PromotionStatus },
  ): void {
    if (!this.isBusinessOwnerOnly(req)) return;

    const requestedStatus =
      (data.status as PromotionStatus) ?? current.requestedStatus ?? current.status;
    data.requestedStatus = requestedStatus;
    data.status = 'draft';

    if (current.approvalStatus === 'approved' || current.approvalStatus === 'rejected') {
      data.approvalStatus = 'draft';
    }
  }

  private static async getOwnerPromotionLimits(req: Request) {
    if (!this.isBusinessOwnerOnly(req) || !req.user?.businessId) return null;
    return PlanLimitService.getPromotionLimitsUsage(req.user.businessId);
  }

  private static resolveBannerCanEdit(
    req: Request,
    banner: {
      _id: Types.ObjectId | string;
      businessId?: Types.ObjectId | null;
      approvalStatus?: PromotionApprovalStatus;
    },
  ): boolean {
    if (this.isSuperAdmin(req)) return true;
    if (!banner.businessId || !req.user?.businessId) return false;
    if (banner.businessId.toString() !== req.user.businessId) return false;
    return banner.approvalStatus !== 'pending';
  }

  private static resolveServiceRowCanEdit(
    req: Request,
    row: {
      _id: Types.ObjectId | string;
      businessId?: Types.ObjectId | null;
      approvalStatus?: PromotionApprovalStatus;
    },
  ): boolean {
    if (this.isSuperAdmin(req)) return true;
    if (!row.businessId || !req.user?.businessId) return false;
    if (row.businessId.toString() !== req.user.businessId) return false;
    return row.approvalStatus !== 'pending';
  }

  private static canSubmitForReview(
    req: Request,
    entity: { businessId?: Types.ObjectId | null; approvalStatus?: PromotionApprovalStatus },
  ): boolean {
    if (this.isSuperAdmin(req)) return false;
    if (!entity.businessId || !req.user?.businessId) return false;
    if (entity.businessId.toString() !== req.user.businessId) return false;
    return entity.approvalStatus === 'draft' || entity.approvalStatus === 'rejected';
  }

  private static async assertOwnerCanEditBanner(req: Request, banner: IPromotionBanner): Promise<void> {
    if (!this.isBusinessOwnerOnly(req) || !req.user?.businessId) return;
    if (!banner.businessId) {
      throw new ForbiddenError('Platform promotions are read-only for business owners');
    }
    if (banner.businessId.toString() !== req.user.businessId) {
      throw new ForbiddenError();
    }
    if (banner.approvalStatus === 'pending') {
      throw new ForbiddenError('Cannot edit a promotion while it is pending review');
    }
  }

  private static async assertOwnerCanEditServiceRow(req: Request, row: IServiceRow): Promise<void> {
    if (!this.isBusinessOwnerOnly(req) || !req.user?.businessId) return;
    if (!row.businessId) {
      throw new ForbiddenError('Platform promotions are read-only for business owners');
    }
    if (row.businessId.toString() !== req.user.businessId) {
      throw new ForbiddenError();
    }
    if (row.approvalStatus === 'pending') {
      throw new ForbiddenError('Cannot edit a promotion while it is pending review');
    }
  }

  private static async notifySuperAdmins(
    payload: Omit<Parameters<typeof NotificationService.notify>[0], 'userId'>,
  ): Promise<void> {
    const admins = await User.find({ roleSlugs: 'super_admin', isDeleted: false, status: 'active' });
    await Promise.all(
      admins.map((admin) =>
        NotificationService.notify({
          userId: admin._id.toString(),
          ...payload,
        }),
      ),
    );
  }

  private static async notifyPromotionSubmitted(
    req: Request,
    entityType: 'banner' | 'service_row',
    entity: { _id: Types.ObjectId; name?: string; rowName?: string; businessId?: Types.ObjectId },
  ): Promise<void> {
    const label = entityType === 'banner' ? entity.name : entity.rowName;
    const business = entity.businessId
      ? await Business.findById(entity.businessId).select('name')
      : null;

    await this.notifySuperAdmins({
      businessId: entity.businessId?.toString(),
      type: 'promotion_submitted',
      title: 'Promotion Submitted for Review',
      body: `${business?.name ?? 'A business'} submitted a ${entityType === 'banner' ? 'banner' : 'service row'} "${label ?? ''}" for approval.`,
      data: {
        entityType,
        entityId: entity._id.toString(),
        businessId: entity.businessId?.toString(),
      },
    });
  }

  private static async notifyPromotionReviewed(
    entityType: 'banner' | 'service_row',
    entity: {
      _id: Types.ObjectId;
      name?: string;
      rowName?: string;
      businessId?: Types.ObjectId;
    },
    outcome: 'approved' | 'rejected',
    remarks?: string,
  ): Promise<void> {
    if (!entity.businessId) return;

    const label = entityType === 'banner' ? entity.name : entity.rowName;
    const isApproved = outcome === 'approved';

    await NotificationService.notifyBusinessOwner(entity.businessId.toString(), {
      type: isApproved ? 'promotion_approved' : 'promotion_rejected',
      title: isApproved ? 'Promotion Approved' : 'Promotion Rejected',
      body: isApproved
        ? `Your ${entityType === 'banner' ? 'banner' : 'service row'} "${label ?? ''}" has been approved.`
        : `Your ${entityType === 'banner' ? 'banner' : 'service row'} "${label ?? ''}" was rejected.${remarks ? ` Note: ${remarks}` : ''}`,
      data: {
        entityType,
        entityId: entity._id.toString(),
        businessId: entity.businessId.toString(),
      },
    });
  }

  private static mapBusinessOwnerInfo(entity: { businessId?: unknown }) {
    const business = entity.businessId as {
      _id?: Types.ObjectId;
      name?: string;
      ownerId?: { firstName?: string; lastName?: string; email?: string };
    } | null;

    if (!business || typeof business !== 'object' || !business._id) {
      return { isPlatformPromotion: true, ownerName: null as string | null, businessName: null as string | null };
    }

    const owner = business.ownerId;
    const ownerName = owner
      ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() || owner.email || null
      : null;

    return {
      isPlatformPromotion: false,
      ownerName,
      businessName: business.name ?? null,
    };
  }

  private static async applyAdminOwnerFilters(
    req: Request,
    filter: FilterQuery<{ businessId?: Types.ObjectId | null }>,
  ): Promise<void> {
    if (!this.isSuperAdmin(req)) return;

    if (req.query.businessId) {
      filter.businessId = new Types.ObjectId(String(req.query.businessId));
      return;
    }

    if (req.query.ownerId) {
      const business = await Business.findOne({
        ownerId: req.query.ownerId,
        isDeleted: false,
      }).select('_id');

      if (!business) {
        filter._id = { $in: [] };
        return;
      }

      filter.businessId = business._id;
      return;
    }

    const scope = String(req.query.scope ?? '');
    if (scope === 'platform') {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        { $or: [{ businessId: null }, { businessId: { $exists: false } }] },
      ];
    } else if (scope === 'owner') {
      filter.businessId = { $exists: true, $ne: null };
    }
  }

  // ─── Banners ───────────────────────────────────────────────────────────────

  private static getBannerListFilter(req: Request): FilterQuery<IPromotionBanner> {
    const filter: FilterQuery<IPromotionBanner> = { isDeleted: false, ...this.getTenantFilter(req) };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const search = String(req.query.search);
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bannerTitle: { $regex: search, $options: 'i' } },
      ];
    }

    return filter;
  }

  static async listBanners(req: Request, page = 1, limit = 20) {
    if (!this.isAdmin(req) && !req.user?.permissions?.includes('promotions.read')) {
      throw new ForbiddenError();
    }

    const filter = this.getBannerListFilter(req);
    await this.applyAdminOwnerFilters(req, filter);
    const skip = (page - 1) * limit;
    const limits = await this.getOwnerPromotionLimits(req);
    const [items, total] = await Promise.all([
      PromotionBanner.find(filter)
        .populate('couponId', 'code name')
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .populate(BUSINESS_POPULATE)
        .skip(skip)
        .limit(limit)
        .sort({ priorityOrder: -1, createdAt: -1 }),
      PromotionBanner.countDocuments(filter),
    ]);

    const enriched = items.map((b) => ({
      ...b.toObject(),
      ...this.mapBusinessOwnerInfo(b),
      effectiveStatus: resolveBannerStatus(b),
      canEdit: this.resolveBannerCanEdit(req, b),
      canSubmit: this.canSubmitForReview(req, b),
    }));

    return {
      items: enriched,
      meta: {
        page,
        limit,
        total,
        ...(limits ? { limits } : {}),
      },
    };
  }

  static async getBannerById(req: Request, id: string) {
    const banner = await PromotionBanner.findOne({ _id: id, isDeleted: false })
      .populate('couponId', 'code name')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .populate('serviceIds', 'name slug image');

    if (!banner) throw new NotFoundError('Banner not found');
    this.assertEntityAccess(req, banner);
    return {
      ...banner.toObject(),
      effectiveStatus: resolveBannerStatus(banner),
      canEdit: this.resolveBannerCanEdit(req, banner),
      canSubmit: this.canSubmitForReview(req, banner),
    };
  }

  static async submitBannerForReview(req: Request, id: string) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const banner = await PromotionBanner.findOne({ _id: id, isDeleted: false });
    if (!banner) throw new NotFoundError('Banner not found');
    this.assertEntityAccess(req, banner);

    if (!this.canSubmitForReview(req, banner)) {
      throw new ConflictError('Only draft or rejected banners can be submitted for review');
    }

    banner.approvalStatus = 'pending';
    banner.status = 'draft';
    banner.requestedStatus = banner.requestedStatus ?? 'active';
    await banner.save();

    await this.notifyPromotionSubmitted(req, 'banner', banner);
    return this.getBannerById(req, id);
  }

  static async createBanner(req: Request, data: Record<string, unknown>) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const bannerType = data.bannerType as BannerType | undefined;
    this.assertOwnerBannerType(req, bannerType);

    const businessId = this.applyBusinessIdOnCreate(req, data as { businessId?: string });
    if (businessId) {
      await PlanLimitService.assertBannerLimit(businessId.toString());
    }

    const approval = this.applyOwnerApprovalOnCreate(req, data);

    const banner = await PromotionBanner.create({
      ...data,
      ...approval,
      businessId,
      createdBy: req.user!.id,
    });

    return this.getBannerById(req, banner._id.toString());
  }

  static async updateBanner(req: Request, id: string, data: Record<string, unknown>) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const banner = await PromotionBanner.findOne({ _id: id, isDeleted: false });
    if (!banner) throw new NotFoundError('Banner not found');
    this.assertEntityAccess(req, banner);
    await this.assertOwnerCanEditBanner(req, banner);

    if (data.bannerType !== undefined) {
      this.assertOwnerBannerType(req, data.bannerType as BannerType);
    }

    if (!this.isSuperAdmin(req) && data.businessId !== undefined) {
      delete data.businessId;
    }

    this.applyOwnerApprovalOnUpdate(req, data, banner);

    Object.assign(banner, data);
    await banner.save();
    return this.getBannerById(req, id);
  }

  static async approveBanner(req: Request, id: string, remarks?: string) {
    if (!this.isSuperAdmin(req)) {
      throw new ForbiddenError('Only super admin can approve banners');
    }

    const banner = await PromotionBanner.findOne({
      _id: id,
      isDeleted: false,
      approvalStatus: 'pending',
    });
    if (!banner) throw new NotFoundError('Pending banner not found');

    banner.approvalStatus = 'approved';
    banner.status = banner.requestedStatus ?? 'active';
    banner.requestedStatus = undefined;
    await banner.save();

    await this.notifyPromotionReviewed('banner', banner, 'approved', remarks);
    return this.getBannerById(req, id);
  }

  static async rejectBanner(req: Request, id: string, remarks?: string) {
    if (!this.isSuperAdmin(req)) {
      throw new ForbiddenError('Only super admin can reject banners');
    }

    const banner = await PromotionBanner.findOne({
      _id: id,
      isDeleted: false,
      approvalStatus: 'pending',
    });
    if (!banner) throw new NotFoundError('Pending banner not found');

    banner.approvalStatus = 'rejected';
    banner.status = 'draft';
    await banner.save();

    await this.notifyPromotionReviewed('banner', banner, 'rejected', remarks);
    return this.getBannerById(req, id);
  }

  static async removeBanner(req: Request, id: string) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const banner = await PromotionBanner.findOne({ _id: id, isDeleted: false });
    if (!banner) throw new NotFoundError('Banner not found');
    this.assertEntityAccess(req, banner);
    await this.assertOwnerCanEditBanner(req, banner);

    banner.isDeleted = true;
    await banner.save();
    return { message: 'Banner deleted' };
  }

  static async getActiveBanners(params: {
    platform?: string;
    location?: string;
    businessId?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    const now = new Date();
    const filter: FilterQuery<IPromotionBanner> = {
      isDeleted: false,
      status: 'active',
      approvalStatus: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (params.businessId) {
      filter.$or = [
        { businessId: new Types.ObjectId(params.businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ];
    }

    if (params.platform) filter.platforms = params.platform;
    if (params.location) filter.locations = params.location;

    const banners = await PromotionBanner.find(filter)
      .populate('couponId', 'code name couponType discountPercentage discountAmount description minBookingAmount')
      .sort({ priorityOrder: -1, createdAt: -1 });

    const filtered = banners.filter((b) => {
      if (params.city && b.targetCities?.length && !b.targetCities.includes(params.city)) {
        return false;
      }
      if (params.state && b.targetStates?.length && !b.targetStates.includes(params.state)) {
        return false;
      }
      if (params.country && b.targetCountries?.length && !b.targetCountries.includes(params.country)) {
        return false;
      }
      return true;
    });

    return Promise.all(
      filtered.map(async (banner) => {
        const obj = banner.toObject();
        const bannerType = PromotionService.resolveBannerType(banner);
        if (bannerType === 'services' && banner.serviceSourceType) {
          const services = await PromotionService.resolveServicesBySource(
            {
              serviceSourceType: banner.serviceSourceType as ServiceRowSourceType,
              categoryId: banner.categoryId,
              subcategoryId: banner.subcategoryId,
              serviceIds: banner.serviceIds,
              maxItems: banner.maxItems,
              businessId: banner.businessId,
            },
            params.businessId,
          );
          return { ...obj, bannerType, services };
        }
        return { ...obj, bannerType };
      }),
    );
  }

  static async getActiveBannerById(
    id: string,
    params: {
      platform?: string;
      businessId?: string;
      city?: string;
      state?: string;
      country?: string;
    } = {},
  ) {
    const now = new Date();
    const banner = await PromotionBanner.findOne({
      _id: id,
      isDeleted: false,
      status: 'active',
      approvalStatus: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now },
      ...(params.platform ? { platforms: params.platform } : {}),
    }).populate('couponId', 'code name couponType discountPercentage discountAmount description minBookingAmount');

    if (!banner) throw new NotFoundError('Banner not found');

    if (params.city && banner.targetCities?.length && !banner.targetCities.includes(params.city)) {
      throw new NotFoundError('Banner not found');
    }
    if (params.state && banner.targetStates?.length && !banner.targetStates.includes(params.state)) {
      throw new NotFoundError('Banner not found');
    }
    if (params.country && banner.targetCountries?.length && !banner.targetCountries.includes(params.country)) {
      throw new NotFoundError('Banner not found');
    }

    const obj = banner.toObject();
    const bannerType = PromotionService.resolveBannerType(banner);
    if (bannerType === 'services' && banner.serviceSourceType) {
      const services = await PromotionService.resolveServicesBySource(
        {
          serviceSourceType: banner.serviceSourceType as ServiceRowSourceType,
          categoryId: banner.categoryId,
          subcategoryId: banner.subcategoryId,
          serviceIds: banner.serviceIds,
          maxItems: banner.maxItems,
          businessId: banner.businessId,
        },
        params.businessId,
      );
      return { ...obj, bannerType, services };
    }
    return { ...obj, bannerType };
  }

  static resolveBannerType(banner: IPromotionBanner): BannerType {
    if (banner.bannerType) return banner.bannerType;
    if (banner.bannerLayoutType === 'html_landing') return 'html';
    if (banner.couponId) return 'coupon';
    if (banner.linkUrl || banner.redirectionUrl || banner.ctaButtonLink) return 'link';
    return 'services';
  }

  private static async resolveServicesBySource(
    source: {
      serviceSourceType: ServiceRowSourceType;
      categoryId?: Types.ObjectId | null;
      subcategoryId?: Types.ObjectId | null;
      serviceIds?: Types.ObjectId[];
      maxItems?: number;
      businessId?: Types.ObjectId | null;
    },
    businessId?: string,
  ): Promise<unknown[]> {
    const baseFilter: FilterQuery<IService> = {
      isDeleted: false,
      status: 'active',
    };

    if (businessId) {
      baseFilter.businessId = new Types.ObjectId(businessId);
    } else if (source.businessId) {
      baseFilter.businessId = source.businessId;
    }

    const limit = source.maxItems || 10;
    const populate = [
      { path: 'parentCategoryId', select: 'name slug' },
      { path: 'subCategoryId', select: 'name slug' },
    ];

    switch (source.serviceSourceType) {
      case 'category':
        if (!source.categoryId) return [];
        return Service.find({ ...baseFilter, parentCategoryId: source.categoryId })
          .select(SERVICE_CARD_SELECT)
          .populate(populate)
          .sort({ displayOrder: 1, createdAt: -1 })
          .limit(limit);

      case 'subcategory':
        if (!source.subcategoryId) return [];
        return Service.find({ ...baseFilter, subCategoryId: source.subcategoryId })
          .select(SERVICE_CARD_SELECT)
          .populate(populate)
          .sort({ displayOrder: 1, createdAt: -1 })
          .limit(limit);

      case 'selected_services':
        if (!source.serviceIds?.length) return [];
        return Service.find({ ...baseFilter, _id: { $in: source.serviceIds } })
          .select(SERVICE_CARD_SELECT)
          .populate(populate)
          .limit(limit);

      case 'featured':
        return Service.find({ ...baseFilter, isFeatured: true })
          .select(SERVICE_CARD_SELECT)
          .populate(populate)
          .sort({ displayOrder: 1, createdAt: -1 })
          .limit(limit);

      case 'new_services':
        return Service.find(baseFilter)
          .select(SERVICE_CARD_SELECT)
          .populate(populate)
          .sort({ createdAt: -1 })
          .limit(limit);

      case 'best_selling': {
        const matchStage: Record<string, unknown> = {
          isDeleted: false,
          serviceId: { $exists: true, $ne: null },
        };
        if (baseFilter.businessId) matchStage.businessId = baseFilter.businessId;

        const topServiceIds = await Booking.aggregate([
          { $match: matchStage },
          { $group: { _id: '$serviceId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ]);

        if (!topServiceIds.length) {
          return Service.find({ ...baseFilter, isPopular: true })
            .select(SERVICE_CARD_SELECT)
            .populate(populate)
            .limit(limit);
        }

        const ids = topServiceIds.map((s) => s._id);
        const services = await Service.find({ ...baseFilter, _id: { $in: ids } })
          .select(SERVICE_CARD_SELECT)
          .populate(populate);

        const orderMap = new Map(ids.map((id, i) => [id.toString(), i]));
        return services.sort(
          (a, b) => (orderMap.get(a._id.toString()) ?? 99) - (orderMap.get(b._id.toString()) ?? 99),
        );
      }

      case 'top_rated': {
        const reviewMatch: Record<string, unknown> = {
          isDeleted: false,
          status: 'approved',
        };
        if (baseFilter.businessId) reviewMatch.businessId = baseFilter.businessId;

        const topRated = await Review.aggregate([
          { $match: reviewMatch },
          {
            $lookup: {
              from: 'bookings',
              localField: 'bookingId',
              foreignField: '_id',
              as: 'booking',
            },
          },
          { $unwind: '$booking' },
          { $match: { 'booking.serviceId': { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$booking.serviceId',
              avgRating: { $avg: '$serviceRating' },
              reviewCount: { $sum: 1 },
            },
          },
          { $sort: { avgRating: -1, reviewCount: -1 } },
          { $limit: limit },
        ]);

        if (!topRated.length) {
          return Service.find({ ...baseFilter, isFeatured: true })
            .select(SERVICE_CARD_SELECT)
            .populate(populate)
            .limit(limit);
        }

        const ids = topRated.map((r) => r._id);
        const services = await Service.find({ ...baseFilter, _id: { $in: ids } })
          .select(SERVICE_CARD_SELECT)
          .populate(populate);

        const ratingMap = new Map(
          topRated.map((r, i) => [r._id.toString(), { avg: r.avgRating, count: r.reviewCount, order: i }]),
        );

        return services
          .map((s) => {
            const stats = ratingMap.get(s._id.toString());
            return {
              ...s.toObject(),
              avgRating: stats?.avg ?? null,
              reviewCount: stats?.count ?? 0,
            };
          })
          .sort(
            (a, b) =>
              (ratingMap.get(a._id.toString())?.order ?? 99) -
              (ratingMap.get(b._id.toString())?.order ?? 99),
          );
      }

      default:
        return [];
    }
  }

  // ─── Service Rows ──────────────────────────────────────────────────────────

  private static getServiceRowListFilter(req: Request): FilterQuery<IServiceRow> {
    const filter: FilterQuery<IServiceRow> = { isDeleted: false, ...this.getTenantFilter(req) };

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      const search = String(req.query.search);
      filter.$or = [
        { rowName: { $regex: search, $options: 'i' } },
        { rowTitle: { $regex: search, $options: 'i' } },
      ];
    }

    return filter;
  }

  static async listServiceRows(req: Request, page = 1, limit = 20) {
    if (!this.isAdmin(req) && !req.user?.permissions?.includes('promotions.read')) {
      throw new ForbiddenError();
    }

    const filter = this.getServiceRowListFilter(req);
    await this.applyAdminOwnerFilters(req, filter);
    const skip = (page - 1) * limit;
    const limits = await this.getOwnerPromotionLimits(req);
    const [items, total] = await Promise.all([
      ServiceRow.find(filter)
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .populate(BUSINESS_POPULATE)
        .skip(skip)
        .limit(limit)
        .sort({ displayOrder: 1, createdAt: -1 }),
      ServiceRow.countDocuments(filter),
    ]);

    const enriched = items.map((row) => ({
      ...row.toObject(),
      ...this.mapBusinessOwnerInfo(row),
      effectiveStatus: resolveServiceRowStatus(row),
      canEdit: this.resolveServiceRowCanEdit(req, row),
      canSubmit: this.canSubmitForReview(req, row),
    }));

    return {
      items: enriched,
      meta: {
        page,
        limit,
        total,
        ...(limits ? { limits } : {}),
      },
    };
  }

  static async getServiceRowById(req: Request, id: string) {
    const row = await ServiceRow.findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .populate('serviceIds', 'name slug image');

    if (!row) throw new NotFoundError('Service row not found');
    this.assertEntityAccess(req, row);
    return {
      ...row.toObject(),
      effectiveStatus: resolveServiceRowStatus(row),
      canEdit: this.resolveServiceRowCanEdit(req, row),
      canSubmit: this.canSubmitForReview(req, row),
    };
  }

  static async submitServiceRowForReview(req: Request, id: string) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const row = await ServiceRow.findOne({ _id: id, isDeleted: false });
    if (!row) throw new NotFoundError('Service row not found');
    this.assertEntityAccess(req, row);

    if (!this.canSubmitForReview(req, row)) {
      throw new ConflictError('Only draft or rejected service rows can be submitted for review');
    }

    row.approvalStatus = 'pending';
    row.status = 'draft';
    row.isActive = false;
    row.requestedStatus = row.requestedStatus ?? 'active';
    await row.save();

    await this.notifyPromotionSubmitted(req, 'service_row', row);
    return this.getServiceRowById(req, id);
  }

  static async createServiceRow(req: Request, data: Record<string, unknown>) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const businessId = this.applyBusinessIdOnCreate(req, data as { businessId?: string });
    if (businessId) {
      await PlanLimitService.assertServiceRowLimit(businessId.toString());
    }

    syncServiceRowActiveFlag(data);
    const approval = this.applyOwnerApprovalOnCreate(req, data);
    if (approval.status !== 'active') {
      data.isActive = false;
    }

    const row = await ServiceRow.create({
      ...data,
      ...approval,
      businessId,
      createdBy: req.user!.id,
    });

    return this.getServiceRowById(req, row._id.toString());
  }

  static async updateServiceRow(req: Request, id: string, data: Record<string, unknown>) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const row = await ServiceRow.findOne({ _id: id, isDeleted: false });
    if (!row) throw new NotFoundError('Service row not found');
    this.assertEntityAccess(req, row);
    await this.assertOwnerCanEditServiceRow(req, row);

    if (!this.isSuperAdmin(req) && data.businessId !== undefined) {
      delete data.businessId;
    }

    this.applyOwnerApprovalOnUpdate(req, data, row);
    syncServiceRowActiveFlag(data);

    Object.assign(row, data);
    await row.save();
    return this.getServiceRowById(req, id);
  }

  static async approveServiceRow(req: Request, id: string, remarks?: string) {
    if (!this.isSuperAdmin(req)) {
      throw new ForbiddenError('Only super admin can approve service rows');
    }

    const row = await ServiceRow.findOne({
      _id: id,
      isDeleted: false,
      approvalStatus: 'pending',
    });
    if (!row) throw new NotFoundError('Pending service row not found');

    row.approvalStatus = 'approved';
    row.status = row.requestedStatus ?? 'active';
    row.isActive = row.status === 'active';
    row.requestedStatus = undefined;
    await row.save();

    await this.notifyPromotionReviewed('service_row', row, 'approved', remarks);
    return this.getServiceRowById(req, id);
  }

  static async rejectServiceRow(req: Request, id: string, remarks?: string) {
    if (!this.isSuperAdmin(req)) {
      throw new ForbiddenError('Only super admin can reject service rows');
    }

    const row = await ServiceRow.findOne({
      _id: id,
      isDeleted: false,
      approvalStatus: 'pending',
    });
    if (!row) throw new NotFoundError('Pending service row not found');

    row.approvalStatus = 'rejected';
    row.status = 'draft';
    row.isActive = false;
    await row.save();

    await this.notifyPromotionReviewed('service_row', row, 'rejected', remarks);
    return this.getServiceRowById(req, id);
  }

  static async removeServiceRow(req: Request, id: string) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const row = await ServiceRow.findOne({ _id: id, isDeleted: false });
    if (!row) throw new NotFoundError('Service row not found');
    this.assertEntityAccess(req, row);
    await this.assertOwnerCanEditServiceRow(req, row);

    row.isDeleted = true;
    await row.save();
    return { message: 'Service row deleted' };
  }

  static async resolveServicesForRow(
    row: IServiceRow,
    businessId?: string,
  ): Promise<unknown[]> {
    return this.resolveServicesBySource(
      {
        serviceSourceType: row.serviceSourceType,
        categoryId: row.categoryId,
        subcategoryId: row.subcategoryId,
        serviceIds: row.serviceIds,
        maxItems: row.maxItems,
        businessId: row.businessId,
      },
      businessId,
    );
  }

  static async getActiveServiceRows(params: {
    platform?: string;
    location?: string;
    businessId?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    const now = new Date();
    const filter: FilterQuery<IServiceRow> = {
      isDeleted: false,
      approvalStatus: 'approved',
      $or: [{ status: 'active' }, { status: { $exists: false }, isActive: true }],
      $and: [
        {
          $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }],
        },
        {
          $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
        },
      ],
    };

    if (params.businessId) {
      filter.$or = [
        { businessId: new Types.ObjectId(params.businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ];
    }

    if (params.platform) filter.platforms = params.platform;
    if (params.location) filter.locations = params.location;

    const rows = await ServiceRow.find(filter).sort({ displayOrder: 1 });

    const filtered = rows.filter((r) => {
      if (params.city && r.targetCities?.length && !r.targetCities.includes(params.city)) {
        return false;
      }
      if (params.state && r.targetStates?.length && !r.targetStates.includes(params.state)) {
        return false;
      }
      if (params.country && r.targetCountries?.length && !r.targetCountries.includes(params.country)) {
        return false;
      }
      return true;
    });

    const result = await Promise.all(
      filtered.map(async (row) => {
        const services = await this.resolveServicesForRow(row, params.businessId);
        return {
          ...row.toObject(),
          services,
        };
      }),
    );

    return result.filter((r) => r.services.length > 0);
  }

  static async getServiceRowWithServices(req: Request, id: string, businessId?: string) {
    const row = await ServiceRow.findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .populate('serviceIds', 'name slug image');

    if (!row) throw new NotFoundError('Service row not found');
    this.assertEntityAccess(req, row);

    const services = await this.resolveServicesForRow(row, businessId);
    return { ...row.toObject(), effectiveStatus: resolveServiceRowStatus(row), services };
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  static async trackEvent(data: {
    entityType: PromotionEntityType;
    entityId: string;
    eventType: PromotionEventType;
    customerId?: string;
    businessId?: string;
    couponId?: string;
    bookingId?: string;
    revenue?: number;
    metadata?: Record<string, unknown>;
  }) {
    const { entityType, entityId, eventType } = data;

    if (!['view', 'click', 'coupon_use', 'booking_conversion'].includes(eventType)) {
      throw new ValidationError('Invalid event type');
    }

    await PromotionEvent.create({
      entityType,
      entityId: new Types.ObjectId(entityId),
      eventType,
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      businessId: data.businessId ? new Types.ObjectId(data.businessId) : undefined,
      couponId: data.couponId ? new Types.ObjectId(data.couponId) : undefined,
      bookingId: data.bookingId ? new Types.ObjectId(data.bookingId) : undefined,
      revenue: data.revenue,
      metadata: data.metadata,
    });

    const counterField = eventType === 'view' ? 'viewCount' : eventType === 'click' ? 'clickCount' : null;

    if (counterField) {
      if (entityType === 'banner') {
        await PromotionBanner.updateOne({ _id: entityId }, { $inc: { [counterField]: 1 } });
      } else {
        await ServiceRow.updateOne({ _id: entityId }, { $inc: { [counterField]: 1 } });
      }
    }

    return { tracked: true };
  }

  static async getStats(req: Request) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    const tenantFilter = this.getTenantFilter(req);
    const eventFilter: FilterQuery<typeof PromotionEvent.prototype> = {};
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      eventFilter.businessId = new Types.ObjectId(req.user.businessId);
    }

    const [
      totalBanners,
      activeBanners,
      totalServiceRows,
      activeServiceRows,
      eventStats,
      topBanners,
      topServiceRows,
    ] = await Promise.all([
      PromotionBanner.countDocuments({ isDeleted: false, ...tenantFilter }),
      PromotionBanner.countDocuments({
        isDeleted: false,
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        ...tenantFilter,
      }),
      ServiceRow.countDocuments({ isDeleted: false, ...tenantFilter }),
      ServiceRow.countDocuments({
        isDeleted: false,
        status: 'active',
        ...tenantFilter,
      }),
      PromotionEvent.aggregate([
        { $match: eventFilter },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$revenue', 0] } },
          },
        },
      ]),
      PromotionBanner.find({ isDeleted: false, ...tenantFilter })
        .sort({ clickCount: -1 })
        .limit(5)
        .select('name bannerTitle clickCount viewCount'),
      ServiceRow.find({ isDeleted: false, ...tenantFilter })
        .sort({ clickCount: -1 })
        .limit(5)
        .select('rowName rowTitle clickCount viewCount'),
    ]);

    const eventMap = Object.fromEntries(
      eventStats.map((e: { _id: string; count: number; revenue: number }) => [e._id, e]),
    );

    const totalViews = eventMap.view?.count ?? 0;
    const totalClicks = eventMap.click?.count ?? 0;
    const couponUsage = eventMap.coupon_use?.count ?? 0;
    const bookingConversions = eventMap.booking_conversion?.count ?? 0;
    const revenueGenerated = eventMap.booking_conversion?.revenue ?? 0;

    return {
      totalBanners,
      activeBanners,
      totalServiceRows,
      activeServiceRows,
      totalViews,
      totalClicks,
      couponUsage,
      bookingConversions,
      revenueGenerated,
      clickThroughRate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0,
      conversionRate:
        totalClicks > 0 ? Math.round((bookingConversions / totalClicks) * 10000) / 100 : 0,
      topBanners,
      topServiceRows,
    };
  }
}
