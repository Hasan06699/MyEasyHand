import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import {
  Coupon,
  ICoupon,
  CouponStatus,
  CouponType,
} from '../../../database/models/coupon.model';
import { CouponUsage } from '../../../database/models/coupon-usage.model';
import { Booking } from '../../../database/models/booking.model';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors/AppError';

export type CouponValidationContext = {
  code: string;
  customerId: string;
  businessId: string;
  subtotal: number;
  serviceIds: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  cityName?: string;
  areaName?: string;
};

export type CouponApplyResult = {
  coupon: ICoupon;
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  cashbackAmount?: number;
  message: string;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function parseTimeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function isWithinTimeWindow(now: Date, startTime?: string, endTime?: string): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null && end === null) return true;
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (start !== null && end !== null) {
    if (start <= end) return minutes >= start && minutes <= end;
    return minutes >= start || minutes <= end;
  }
  if (start !== null) return minutes >= start;
  if (end !== null) return minutes <= end;
  return true;
}

export class CouponService {
  static resolveEffectiveStatus(coupon: ICoupon, now = new Date()): CouponStatus {
    if (coupon.status === 'disabled' || coupon.status === 'draft') return coupon.status;
    if (now > coupon.validityEndDate) return 'expired';
    if (now < coupon.validityStartDate) return 'scheduled';
    if (coupon.status === 'active' || coupon.status === 'scheduled') return 'active';
    return coupon.status;
  }

  private static isAdmin(req: Request): boolean {
    const roles = req.user?.roles ?? [];
    return roles.includes('super_admin') || roles.includes('business_owner');
  }

  private static canManage(req: Request): boolean {
    return (
      req.user?.permissions?.includes('coupons.manage') ||
      req.user?.roles.includes('super_admin') ||
      false
    );
  }

  private static getListFilter(req: Request): FilterQuery<ICoupon> {
    const filter: FilterQuery<ICoupon> = { isDeleted: false };

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.$or = [
        { businessId: new Types.ObjectId(req.user.businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ];
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.couponType) filter.couponType = req.query.couponType;
    if (req.query.search) {
      const search = String(req.query.search);
      filter.$and = [
        ...(filter.$and ?? []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    return filter;
  }

  private static assertCouponAccess(req: Request, coupon: ICoupon) {
    if (req.user?.roles.includes('super_admin')) return;
    if (
      coupon.businessId &&
      req.user?.businessId &&
      coupon.businessId.toString() === req.user.businessId
    ) {
      return;
    }
    if (!coupon.businessId && req.user?.roles.includes('business_owner')) {
      throw new ForbiddenError('Platform coupons are read-only for business owners');
    }
    throw new ForbiddenError();
  }

  static async list(req: Request, page = 1, limit = 20) {
    if (!this.isAdmin(req) && !req.user?.permissions?.includes('coupons.read')) {
      throw new ForbiddenError();
    }

    const filter = this.getListFilter(req);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Coupon.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Coupon.countDocuments(filter),
    ]);

    const enriched = items.map((c) => ({
      ...c.toObject(),
      effectiveStatus: this.resolveEffectiveStatus(c),
    }));

    return { items: enriched, meta: { page, limit, total } };
  }

  static async getById(req: Request, id: string) {
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!coupon) throw new NotFoundError('Coupon not found');
    this.assertCouponAccess(req, coupon);
    return {
      ...coupon.toObject(),
      effectiveStatus: this.resolveEffectiveStatus(coupon),
    };
  }

  static async create(req: Request, data: Record<string, unknown>) {
    if (!this.canManage(req)) throw new ForbiddenError();

    const code = normalizeCode(String(data.code));
    const businessId = req.user?.roles.includes('super_admin')
      ? (data.businessId as string | undefined)
      : req.user?.businessId;

    const existingFilter: FilterQuery<ICoupon> = { code, isDeleted: false };
    if (businessId) {
      existingFilter.businessId = new Types.ObjectId(businessId);
    } else {
      existingFilter.$or = [{ businessId: { $exists: false } }, { businessId: null }];
    }

    const existing = await Coupon.findOne(existingFilter);
    if (existing) throw new ConflictError('Coupon code already exists');

    const coupon = await Coupon.create({
      ...data,
      code,
      businessId: businessId ? new Types.ObjectId(businessId) : undefined,
      createdBy: new Types.ObjectId(req.user!.id),
    });

    return coupon;
  }

  static async update(req: Request, id: string, data: Record<string, unknown>) {
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!coupon) throw new NotFoundError('Coupon not found');
    this.assertCouponAccess(req, coupon);
    if (!this.canManage(req)) throw new ForbiddenError();

    if (data.code) {
      data.code = normalizeCode(String(data.code));
      const businessId = coupon.businessId?.toString();
      const dupFilter: FilterQuery<ICoupon> = {
        code: data.code as string,
        _id: { $ne: id },
        isDeleted: false,
      };
      if (businessId) dupFilter.businessId = new Types.ObjectId(businessId);
      const dup = await Coupon.findOne(dupFilter);
      if (dup) throw new ConflictError('Coupon code already exists');
    }

    return Coupon.findByIdAndUpdate(id, data, { new: true });
  }

  static async remove(req: Request, id: string) {
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!coupon) throw new NotFoundError('Coupon not found');
    this.assertCouponAccess(req, coupon);
    if (!this.canManage(req)) throw new ForbiddenError();

    await Coupon.findByIdAndUpdate(id, { isDeleted: true, status: 'disabled' });
    return { message: 'Coupon deleted' };
  }

  static async duplicate(req: Request, id: string) {
    const source = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!source) throw new NotFoundError('Coupon not found');
    this.assertCouponAccess(req, source);
    if (!this.canManage(req)) throw new ForbiddenError();

    const baseCode = `${source.code}_COPY`;
    let code = baseCode;
    let suffix = 1;
    while (await Coupon.findOne({ code, isDeleted: false, businessId: source.businessId })) {
      code = `${baseCode}${suffix++}`;
    }

    const sourceObj = source.toObject();
    const { _id, usageCount, ...rest } = sourceObj;
    void _id;
    void usageCount;
    return Coupon.create({
      ...rest,
      name: `${source.name} (Copy)`,
      code,
      status: 'draft',
      usageCount: 0,
      duplicatedFrom: source._id,
      createdBy: new Types.ObjectId(req.user!.id),
    });
  }

  static async disable(req: Request, id: string) {
    return this.update(req, id, { status: 'disabled' });
  }

  private static async isNewCustomer(customerId: string, businessId: string): Promise<boolean> {
    const count = await Booking.countDocuments({
      customerId: new Types.ObjectId(customerId),
      businessId: new Types.ObjectId(businessId),
      isDeleted: false,
      status: { $nin: ['cancelled', 'rejected'] },
    });
    return count === 0;
  }

  private static async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    return CouponUsage.countDocuments({
      couponId: new Types.ObjectId(couponId),
      customerId: new Types.ObjectId(customerId),
    });
  }

  static async validateCoupon(ctx: CouponValidationContext, options?: { skipUsageRecord?: boolean }): Promise<CouponApplyResult> {
    const code = normalizeCode(ctx.code);
    const now = new Date();

    const couponFilter: FilterQuery<ICoupon> = {
      code,
      isDeleted: false,
      $or: [
        { businessId: new Types.ObjectId(ctx.businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ],
    };

    const coupon = await Coupon.findOne(couponFilter);
    if (!coupon) throw new ValidationError('Invalid coupon code');

    const effectiveStatus = this.resolveEffectiveStatus(coupon, now);
    if (effectiveStatus === 'disabled' || effectiveStatus === 'draft') {
      throw new ValidationError('Coupon is not active');
    }
    if (effectiveStatus === 'expired') throw new ValidationError('Coupon has expired');
    if (effectiveStatus === 'scheduled') throw new ValidationError('Coupon is not yet valid');

    if (now < coupon.validityStartDate || now > coupon.validityEndDate) {
      throw new ValidationError('Coupon is outside validity period');
    }

    if (!isWithinTimeWindow(now, coupon.validityStartTime, coupon.validityEndTime)) {
      throw new ValidationError('Coupon is not valid at this time');
    }

    if (coupon.usageLimitType === 'total' && coupon.totalUsageLimit) {
      if (coupon.usageCount >= coupon.totalUsageLimit) {
        throw new ValidationError('Coupon usage limit reached');
      }
    }

    if (coupon.usageLimitType === 'per_customer' || coupon.perCustomerLimit) {
      const limit = coupon.perCustomerLimit ?? 1;
      const used = await this.getCustomerUsageCount(coupon._id.toString(), ctx.customerId);
      if (used >= limit) {
        throw new ValidationError('You have reached the usage limit for this coupon');
      }
    }

    if (coupon.minBookingAmount && ctx.subtotal < coupon.minBookingAmount) {
      throw new ValidationError(
        `Minimum booking amount of ₹${coupon.minBookingAmount} not met`,
      );
    }

    if (coupon.maxBookingAmount && ctx.subtotal > coupon.maxBookingAmount) {
      throw new ValidationError(
        `Booking amount exceeds maximum of ₹${coupon.maxBookingAmount} for this coupon`,
      );
    }

    if (coupon.vendorRestrictionType === 'selected' && coupon.businessIds?.length) {
      const allowed = coupon.businessIds.some((id) => id.toString() === ctx.businessId);
      if (!allowed) throw new ValidationError('Coupon not valid for this service provider');
    }

    if (coupon.customerEligibility === 'new') {
      const isNew = await this.isNewCustomer(ctx.customerId, ctx.businessId);
      if (!isNew) throw new ValidationError('Coupon is only for new customers');
    }

    if (coupon.customerEligibility === 'existing') {
      const isNew = await this.isNewCustomer(ctx.customerId, ctx.businessId);
      if (isNew) throw new ValidationError('Coupon is only for existing customers');
    }

    if (coupon.customerEligibility === 'specific' && coupon.eligibleCustomerIds?.length) {
      const eligible = coupon.eligibleCustomerIds.some((id) => id.toString() === ctx.customerId);
      if (!eligible) throw new ValidationError('You are not eligible for this coupon');
    }

    if (coupon.couponType === 'first_booking') {
      const isNew = await this.isNewCustomer(ctx.customerId, ctx.businessId);
      if (!isNew) throw new ValidationError('First booking coupon can only be used once');
      const used = await this.getCustomerUsageCount(coupon._id.toString(), ctx.customerId);
      if (used > 0) throw new ValidationError('First booking coupon already used');
    }

    if (coupon.serviceRestrictionType === 'categories' && coupon.categoryIds?.length) {
      const allowed = coupon.categoryIds.map((id) => id.toString());
      const match = ctx.categoryIds.some((id) => allowed.includes(id));
      if (!match) throw new ValidationError('Coupon not valid for selected services');
    }

    if (coupon.serviceRestrictionType === 'subcategories' && coupon.subcategoryIds?.length) {
      const allowed = coupon.subcategoryIds.map((id) => id.toString());
      const match = ctx.subcategoryIds.some((id) => allowed.includes(id));
      if (!match) throw new ValidationError('Coupon not valid for selected services');
    }

    if (coupon.serviceRestrictionType === 'services' && coupon.serviceIds?.length) {
      const allowed = coupon.serviceIds.map((id) => id.toString());
      const match = ctx.serviceIds.some((id) => allowed.includes(id));
      if (!match) throw new ValidationError('Coupon not valid for selected services');
    }

    if (coupon.locationRestrictionType === 'cities' && coupon.cityNames?.length && ctx.cityName) {
      const cities = coupon.cityNames.map((c) => c.toLowerCase());
      if (!cities.includes(ctx.cityName.toLowerCase())) {
        throw new ValidationError('Coupon not valid in your city');
      }
    }

    if (coupon.locationRestrictionType === 'areas' && coupon.areaNames?.length && ctx.areaName) {
      const areas = coupon.areaNames.map((a) => a.toLowerCase());
      if (!areas.includes(ctx.areaName.toLowerCase())) {
        throw new ValidationError('Coupon not valid in your area');
      }
    }

    const { discountAmount, discountType, cashbackAmount } = this.calculateDiscount(
      coupon,
      ctx.subtotal,
    );

    return {
      coupon,
      discountAmount,
      discountType,
      cashbackAmount,
      message: 'Coupon applied successfully',
    };
  }

  static calculateDiscount(
    coupon: ICoupon,
    subtotal: number,
  ): { discountAmount: number; discountType: 'fixed' | 'percentage'; cashbackAmount?: number } {
    switch (coupon.couponType as CouponType) {
      case 'percentage':
      case 'first_booking': {
        const pct = coupon.discountPercentage ?? 0;
        let discount = Math.round((subtotal * pct) / 100);
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
        return { discountAmount: discount, discountType: 'percentage' };
      }
      case 'fixed_amount':
        return {
          discountAmount: Math.min(coupon.discountAmount ?? 0, subtotal),
          discountType: 'fixed',
        };
      case 'free_service':
        return { discountAmount: subtotal, discountType: 'fixed' };
      case 'cashback':
        return {
          discountAmount: 0,
          discountType: 'fixed',
          cashbackAmount: coupon.discountAmount ?? 0,
        };
      default:
        return { discountAmount: 0, discountType: 'fixed' };
    }
  }

  static async recordUsage(params: {
    couponId: string;
    customerId: string;
    bookingId: string;
    orderGroupId?: string;
    businessId: string;
    discountApplied: number;
    cashbackAmount?: number;
    status?: 'pending' | 'completed';
  }) {
    await CouponUsage.create({
      couponId: new Types.ObjectId(params.couponId),
      customerId: new Types.ObjectId(params.customerId),
      bookingId: new Types.ObjectId(params.bookingId),
      orderGroupId: params.orderGroupId,
      businessId: new Types.ObjectId(params.businessId),
      discountApplied: params.discountApplied,
      cashbackAmount: params.cashbackAmount,
      status: params.cashbackAmount ? 'pending' : (params.status ?? 'completed'),
    });

    await Coupon.findByIdAndUpdate(params.couponId, { $inc: { usageCount: 1 } });
  }

  static async completeCashback(bookingId: string) {
    const usages = await CouponUsage.find({
      bookingId: new Types.ObjectId(bookingId),
      status: 'pending',
      cashbackAmount: { $gt: 0 },
    });

    for (const usage of usages) {
      usage.status = 'completed';
      await usage.save();
    }
  }

  static async listAvailableForCustomer(req: Request, businessId?: string) {
    const now = new Date();
    const filter: FilterQuery<ICoupon> = {
      isDeleted: false,
      status: { $in: ['active', 'scheduled'] },
      validityStartDate: { $lte: now },
      validityEndDate: { $gte: now },
    };

    if (businessId) {
      filter.$or = [
        { businessId: new Types.ObjectId(businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ];
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).limit(50);

    return coupons
      .filter((c) => this.resolveEffectiveStatus(c, now) === 'active')
      .map((c) => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        description: c.description,
        couponType: c.couponType,
        discountPercentage: c.discountPercentage,
        maxDiscountAmount: c.maxDiscountAmount,
        discountAmount: c.discountAmount,
        validityEndDate: c.validityEndDate,
        termsAndConditions: c.termsAndConditions,
        minBookingAmount: c.minBookingAmount,
        displayValue: this.getDisplayValue(c),
      }));
  }

  static getDisplayValue(coupon: ICoupon): string {
    switch (coupon.couponType) {
      case 'percentage':
      case 'first_booking':
        return coupon.maxDiscountAmount
          ? `${coupon.discountPercentage}% off (max ₹${coupon.maxDiscountAmount})`
          : `${coupon.discountPercentage}% off`;
      case 'fixed_amount':
        return `₹${coupon.discountAmount} off`;
      case 'cashback':
        return `₹${coupon.discountAmount} cashback`;
      case 'free_service':
        return 'Free service';
      default:
        return coupon.name;
    }
  }

  static async findBestCoupon(
    customerId: string,
    businessId: string,
    subtotal: number,
    serviceIds: string[],
    categoryIds: string[],
    subcategoryIds: string[],
    cityName?: string,
    areaName?: string,
  ): Promise<CouponApplyResult | null> {
    const now = new Date();
    const coupons = await Coupon.find({
      isDeleted: false,
      autoApplyMode: 'best',
      status: 'active',
      validityStartDate: { $lte: now },
      validityEndDate: { $gte: now },
      $or: [
        { businessId: new Types.ObjectId(businessId) },
        { businessId: { $exists: false } },
        { businessId: null },
      ],
    });

    let best: CouponApplyResult | null = null;

    for (const coupon of coupons) {
      try {
        const result = await this.validateCoupon({
          code: coupon.code,
          customerId,
          businessId,
          subtotal,
          serviceIds,
          categoryIds,
          subcategoryIds,
          cityName,
          areaName,
        });
        if (!best || result.discountAmount > best.discountAmount) {
          best = result;
        }
      } catch {
        // skip invalid coupons
      }
    }

    return best;
  }

  static async getStats(req: Request) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    const filter = this.getListFilter(req);
    const coupons = await Coupon.find(filter);

    const now = new Date();
    const active = coupons.filter((c) => this.resolveEffectiveStatus(c, now) === 'active').length;
    const expired = coupons.filter((c) => this.resolveEffectiveStatus(c, now) === 'expired').length;

    const couponIds = coupons.map((c) => c._id);
    const usages = await CouponUsage.find({ couponId: { $in: couponIds } });

    const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discountApplied, 0);
    const totalOrders = usages.length;
    const totalCashback = usages.reduce((sum, u) => sum + (u.cashbackAmount ?? 0), 0);

    const topCoupons = await CouponUsage.aggregate([
      { $match: { couponId: { $in: couponIds } } },
      { $group: { _id: '$couponId', count: { $sum: 1 }, totalDiscount: { $sum: '$discountApplied' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topWithNames = await Promise.all(
      topCoupons.map(async (t) => {
        const c = await Coupon.findById(t._id);
        return {
          couponId: t._id,
          code: c?.code,
          name: c?.name,
          usageCount: t.count,
          totalDiscount: t.totalDiscount,
        };
      }),
    );

    const ownerWise = await CouponUsage.aggregate([
      { $match: { couponId: { $in: couponIds }, businessId: { $exists: true } } },
      { $group: { _id: '$businessId', count: { $sum: 1 }, totalDiscount: { $sum: '$discountApplied' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalCoupons: coupons.length,
      activeCoupons: active,
      expiredCoupons: expired,
      totalUsageCount: totalOrders,
      totalDiscountGiven,
      totalCashback,
      conversionRate: coupons.length ? Math.round((totalOrders / coupons.length) * 100) / 100 : 0,
      topPerformingCoupons: topWithNames,
      ownerWiseUsage: ownerWise,
    };
  }
}
