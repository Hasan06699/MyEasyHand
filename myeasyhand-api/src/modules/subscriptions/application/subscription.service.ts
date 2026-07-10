import { Types, FilterQuery } from 'mongoose';
import { Subscription, ISubscription, SubscriptionStatus } from '../../../database/models/subscription.model';
import { Plan } from '../../../database/models/plan.model';
import { Business } from '../../../database/models/business.model';
import { User } from '../../../database/models/user.model';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { Request } from 'express';
import { SubscriptionAccessService } from './subscription-access.service';
import { PlanRequest } from '../../../database/models/plan-request.model';
import { NotificationService } from '../../../services/notification.service';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class SubscriptionService {
  static async list(req: Request, page = 1, limit = 20, filters?: { status?: SubscriptionStatus; businessId?: string }) {
    const filter: FilterQuery<ISubscription> = { isDeleted: false };

    if (!req.user?.roles.includes('super_admin')) {
      if (!req.user?.businessId) throw new ForbiddenError();
      filter.businessId = req.user.businessId;
    } else if (filters?.businessId) {
      filter.businessId = filters.businessId;
    }

    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .populate('planId', 'name slug price billingCycle durationDays limits features')
        .populate('businessId', 'name slug email status')
        .populate('ownerId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Subscription.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }

  static async getById(id: string, req: Request) {
    const subscription = await Subscription.findOne({ _id: id, isDeleted: false })
      .populate('planId')
      .populate('businessId', 'name slug email status')
      .populate('ownerId', 'firstName lastName email');

    if (!subscription) throw new NotFoundError('Subscription not found');

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId !== String(subscription.businessId)) {
      throw new ForbiddenError();
    }

    return subscription;
  }

  static async getStatus(req: Request) {
    if (!req.user?.businessId) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        pendingRequest: null,
      };
    }

    const subscription = await SubscriptionAccessService.getLatestForBusiness(req.user.businessId);
    const hasActiveSubscription = SubscriptionAccessService.isValid(subscription);

    const pendingRequest = await PlanRequest.findOne({
      businessId: req.user.businessId,
      status: 'pending',
    }).populate('planId', 'name slug price billingCycle durationDays limits features');

    return {
      hasActiveSubscription,
      subscription,
      pendingRequest,
    };
  }

  static async getMySubscription(req: Request) {
    if (!req.user?.businessId) throw new NotFoundError('No active subscription found');

    const subscription = await SubscriptionAccessService.getLatestForBusiness(req.user.businessId);
    if (!subscription || !SubscriptionAccessService.isValid(subscription)) {
      throw new NotFoundError('No active subscription found');
    }

    return subscription;
  }

  static async assign(data: {
    businessId: string;
    planId: string;
    status?: SubscriptionStatus;
    startDate?: Date;
    expiresAt?: Date;
    notes?: string;
  }) {
    const business = await Business.findOne({ _id: data.businessId, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    const plan = await Plan.findOne({ _id: data.planId, isDeleted: false, isActive: true });
    if (!plan) throw new NotFoundError('Plan not found');

    const owner = await User.findById(business.ownerId);
    if (!owner) throw new NotFoundError('Business owner not found');

    const activeSub = await Subscription.findOne({
      businessId: business._id,
      isDeleted: false,
      status: { $in: ['trial', 'active', 'past_due'] },
    });
    if (activeSub && SubscriptionAccessService.isValid(activeSub)) {
      throw new ConflictError('Business already has an active subscription');
    }

    const startDate = data.startDate || new Date();
    const expiresAt = data.expiresAt || addDays(startDate, plan.durationDays);

    const subscription = await Subscription.create({
      businessId: business._id,
      ownerId: owner._id,
      planId: plan._id,
      status: data.status || 'active',
      startDate,
      expiresAt,
      notes: data.notes,
    });

    await Business.findByIdAndUpdate(business._id, { subscriptionId: subscription._id });

    const populated = await subscription.populate('planId');
    await NotificationService.notify({
      userId: owner._id.toString(),
      businessId: business._id.toString(),
      type: 'subscription_assigned',
      title: 'Subscription Activated',
      body: `Your ${plan.name} plan has been assigned by admin.`,
      data: { subscriptionId: subscription._id.toString(), planId: plan._id.toString() },
    });

    return populated;
  }

  static async update(id: string, data: {
    planId?: string;
    status?: SubscriptionStatus;
    startDate?: Date;
    expiresAt?: Date;
    notes?: string;
  }, req: Request) {
    const subscription = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only admin can update subscriptions');
    }

    const update: Partial<ISubscription> = {};

    if (data.planId) {
      const plan = await Plan.findOne({ _id: data.planId, isDeleted: false, isActive: true });
      if (!plan) throw new NotFoundError('Plan not found');
      update.planId = new Types.ObjectId(data.planId);
    }

    if (data.status) {
      update.status = data.status;
      if (data.status === 'cancelled') {
        update.cancelledAt = new Date();
      }
    }

    if (data.expiresAt) update.expiresAt = data.expiresAt;
    if (data.startDate) update.startDate = data.startDate;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.status === 'active' || data.status === 'trial') {
      update.cancelledAt = undefined;
    }

    const updated = await Subscription.findByIdAndUpdate(id, update, { new: true })
      .populate('planId')
      .populate('businessId', 'name slug email status')
      .populate('ownerId', 'firstName lastName email');

    if (updated) {
      await NotificationService.notify({
        userId: updated.ownerId._id?.toString() || updated.ownerId.toString(),
        businessId: updated.businessId._id?.toString() || updated.businessId.toString(),
        type: 'subscription_updated',
        title: 'Subscription Updated',
        body: `Your subscription has been updated by admin. Status: ${updated.status}.`,
        data: { subscriptionId: updated._id.toString(), planId: updated.planId?._id?.toString() },
      });
    }

    return updated;
  }

  static async renew(id: string, req: Request) {
    const subscription = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only admin can renew subscriptions');
    }

    const plan = await Plan.findById(subscription.planId);
    if (!plan) throw new NotFoundError('Plan not found');

    const baseDate = subscription.expiresAt > new Date() ? subscription.expiresAt : new Date();
    const expiresAt = addDays(baseDate, plan.durationDays);

    const updated = await Subscription.findByIdAndUpdate(
      id,
      { expiresAt, status: 'active', cancelledAt: undefined },
      { new: true },
    )
      .populate('planId')
      .populate('businessId', 'name slug email status')
      .populate('ownerId', 'firstName lastName email');

    if (updated) {
      await NotificationService.notify({
        userId: updated.ownerId._id?.toString() || updated.ownerId.toString(),
        businessId: updated.businessId._id?.toString() || updated.businessId.toString(),
        type: 'subscription_renewed',
        title: 'Subscription Renewed',
        body: `Your subscription has been renewed until ${expiresAt.toLocaleDateString()}.`,
        data: { subscriptionId: updated._id.toString() },
      });
    }

    return updated;
  }

  static async cancel(id: string, req: Request) {
    const subscription = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId !== String(subscription.businessId)) {
      throw new ForbiddenError();
    }

    const updated = await Subscription.findByIdAndUpdate(
      id,
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true },
    )
      .populate('planId')
      .populate('businessId', 'name slug email status')
      .populate('ownerId', 'firstName lastName email');

    if (updated) {
      await NotificationService.notify({
        userId: updated.ownerId._id?.toString() || updated.ownerId.toString(),
        businessId: updated.businessId._id?.toString() || updated.businessId.toString(),
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        body: 'Your subscription has been cancelled.',
        data: { subscriptionId: updated._id.toString() },
      });
    }

    return updated;
  }

  static async remove(id: string, req: Request) {
    const subscription = await Subscription.findOne({ _id: id, isDeleted: false });
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only admin can delete subscriptions');
    }

    await Subscription.findByIdAndUpdate(id, { isDeleted: true, status: 'cancelled' });
    await Business.findByIdAndUpdate(subscription.businessId, { $unset: { subscriptionId: 1 } });

    return { message: 'Subscription deleted' };
  }
}
