import { Types } from 'mongoose';
import { PlanRequest } from '../../../database/models/plan-request.model';
import { Plan } from '../../../database/models/plan.model';
import { Subscription } from '../../../database/models/subscription.model';
import { Business } from '../../../database/models/business.model';
import { User } from '../../../database/models/user.model';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../common/errors/AppError';
import { Request } from 'express';
import { SubscriptionAccessService } from './subscription-access.service';
import { NotificationService } from '../../../services/notification.service';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class PlanRequestService {
  private static assertBusinessOwner(req: Request): void {
    if (!req.user?.roles.includes('business_owner') || !req.user.businessId) {
      throw new ForbiddenError('Only business owners can request plans');
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

    return PlanRequest.find(filter)
      .populate('businessId', 'name slug email')
      .populate('requestedBy', 'firstName lastName email')
      .populate('planId', 'name slug price billingCycle durationDays limits features')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async create(req: Request, data: { planId: string; type: 'activate' | 'upgrade'; note?: string }) {
    this.assertBusinessOwner(req);

    const plan = await Plan.findOne({ _id: data.planId, isDeleted: false, isActive: true });
    if (!plan) throw new NotFoundError('Plan not found');

    const hasActive = await SubscriptionAccessService.hasActiveSubscription(req.user!.businessId);
    const latestSubscription = await SubscriptionAccessService.getLatestForBusiness(req.user!.businessId!);

    if (data.type === 'activate' && hasActive) {
      throw new ConflictError('You already have an active subscription. Request an upgrade instead.');
    }

    if (data.type === 'upgrade' && !hasActive) {
      throw new ConflictError('No active subscription to upgrade. Request activation instead.');
    }

    const pending = await PlanRequest.findOne({
      businessId: req.user!.businessId,
      status: 'pending',
    });
    if (pending) {
      throw new ConflictError('You already have a pending plan request');
    }

    const created = await PlanRequest.create({
      businessId: new Types.ObjectId(req.user!.businessId),
      requestedBy: new Types.ObjectId(req.user!.id),
      planId: plan._id,
      type: data.type,
      note: data.note,
      status: 'pending',
      subscriptionId: latestSubscription?._id,
    });

    const admins = await User.find({ roleSlugs: 'super_admin', isDeleted: false, status: 'active' });
    await Promise.all(
      admins.map((admin) =>
        NotificationService.notify({
          userId: admin._id.toString(),
          businessId: req.user!.businessId,
          type: 'plan_request_pending',
          title: 'New Plan Request',
          body: `A business owner requested ${data.type} for plan ${plan.name}.`,
          data: { planRequestId: created._id.toString() },
        }),
      ),
    );

    return created;
  }

  static async approve(req: Request, id: string, reviewNote?: string) {
    this.assertSuperAdmin(req);

    const request = await PlanRequest.findById(id);
    if (!request) throw new NotFoundError('Plan request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be approved');
    }

    const plan = await Plan.findOne({ _id: request.planId, isDeleted: false, isActive: true });
    if (!plan) throw new NotFoundError('Plan not found');

    const business = await Business.findOne({ _id: request.businessId, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    let subscription = await Subscription.findOne({
      businessId: request.businessId,
      isDeleted: false,
      status: { $in: ['trial', 'active', 'past_due', 'expired', 'cancelled'] },
    }).sort({ createdAt: -1 });

    const startDate = new Date();
    const expiresAt = addDays(startDate, plan.durationDays);

    if (request.type === 'activate') {
      if (subscription && SubscriptionAccessService.isValid(subscription)) {
        throw new ConflictError('Business already has an active subscription');
      }

      if (subscription) {
        subscription = await Subscription.findByIdAndUpdate(
          subscription._id,
          {
            planId: plan._id,
            status: 'active',
            startDate,
            expiresAt,
            cancelledAt: undefined,
          },
          { new: true },
        );
      } else {
        subscription = await Subscription.create({
          businessId: business._id,
          ownerId: business.ownerId,
          planId: plan._id,
          status: 'active',
          startDate,
          expiresAt,
        });
      }
    } else {
      if (!subscription) {
        throw new ValidationError('No subscription found to upgrade');
      }

      const baseDate = subscription.expiresAt > new Date() ? subscription.expiresAt : new Date();
      subscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          planId: plan._id,
          status: 'active',
          expiresAt: addDays(baseDate, plan.durationDays),
          cancelledAt: undefined,
        },
        { new: true },
      );
    }

    if (!subscription) throw new ValidationError('Failed to apply subscription');

    await Business.findByIdAndUpdate(business._id, { subscriptionId: subscription._id });

    request.status = 'approved';
    request.reviewNote = reviewNote;
    request.reviewedBy = new Types.ObjectId(req.user!.id);
    request.reviewedAt = new Date();
    request.subscriptionId = subscription._id;
    await request.save();

    await NotificationService.notify({
      userId: request.requestedBy.toString(),
      businessId: request.businessId.toString(),
      type: 'plan_request_approved',
      title: 'Plan Request Approved',
      body: `Your ${request.type} request for ${plan.name} has been approved.`,
      data: { planRequestId: request._id.toString(), subscriptionId: subscription._id.toString() },
    });

    return PlanRequest.findById(request._id)
      .populate('businessId', 'name slug email')
      .populate('requestedBy', 'firstName lastName email')
      .populate('planId')
      .populate('reviewedBy', 'firstName lastName email');
  }

  static async reject(req: Request, id: string, reviewNote?: string) {
    this.assertSuperAdmin(req);

    const request = await PlanRequest.findById(id);
    if (!request) throw new NotFoundError('Plan request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be rejected');
    }

    request.status = 'rejected';
    request.reviewNote = reviewNote;
    request.reviewedBy = new Types.ObjectId(req.user!.id);
    request.reviewedAt = new Date();
    await request.save();

    await NotificationService.notify({
      userId: request.requestedBy.toString(),
      businessId: request.businessId.toString(),
      type: 'plan_request_rejected',
      title: 'Plan Request Rejected',
      body: reviewNote || 'Your plan request was rejected by admin.',
      data: { planRequestId: request._id.toString() },
    });

    return PlanRequest.findById(request._id)
      .populate('businessId', 'name slug email')
      .populate('requestedBy', 'firstName lastName email')
      .populate('planId')
      .populate('reviewedBy', 'firstName lastName email');
  }
}
