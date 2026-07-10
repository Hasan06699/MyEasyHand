import { Types } from 'mongoose';
import { Subscription, ISubscription } from '../../../database/models/subscription.model';

const ACTIVE_STATUSES = ['trial', 'active', 'past_due'] as const;

export class SubscriptionAccessService {
  static isValid(subscription: ISubscription | null): boolean {
    if (!subscription || subscription.isDeleted) return false;
    if (!ACTIVE_STATUSES.includes(subscription.status as typeof ACTIVE_STATUSES[number])) return false;
    return new Date(subscription.expiresAt) > new Date();
  }

  static async getLatestForBusiness(businessId: string | Types.ObjectId) {
    const subscription = await Subscription.findOne({
      businessId,
      isDeleted: false,
    })
      .populate('planId')
      .sort({ createdAt: -1 });

    if (subscription && !this.isValid(subscription) && ACTIVE_STATUSES.includes(subscription.status as typeof ACTIVE_STATUSES[number])) {
      await Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' });
      subscription.status = 'expired';
    }

    return subscription;
  }

  static async hasActiveSubscription(businessId?: string): Promise<boolean> {
    if (!businessId) return false;
    const subscription = await this.getLatestForBusiness(businessId);
    return this.isValid(subscription);
  }
}
