import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors/AppError';
import { SubscriptionAccessService } from '../modules/subscriptions/application/subscription-access.service';

export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.roles.includes('business_owner')) {
      next();
      return;
    }

    const hasActive = await SubscriptionAccessService.hasActiveSubscription(req.user.businessId);
    if (!hasActive) {
      throw new ForbiddenError('Active subscription required. Please request a plan from the Subscriptions page.');
    }

    next();
  } catch (error) {
    next(error);
  }
}
