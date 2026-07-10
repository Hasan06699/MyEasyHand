import { IPlan } from '../../../database/models/plan.model';
import { PromotionBanner } from '../../../database/models/promotion-banner.model';
import { ServiceRow } from '../../../database/models/service-row.model';
import { Service } from '../../../database/models/service.model';
import { ForbiddenError, ValidationError } from '../../../common/errors/AppError';
import { SubscriptionAccessService } from './subscription-access.service';

export type PromotionLimitsUsage = {
  maxBanners: number;
  maxServiceRows: number;
  bannerCount: number;
  serviceRowCount: number;
  canCreateBanner: boolean;
  canCreateServiceRow: boolean;
  editableBannerId: string | null;
  editableServiceRowId: string | null;
};

export class PlanLimitService {
  private static async getPlanForBusiness(businessId: string): Promise<IPlan> {
    const subscription = await SubscriptionAccessService.getLatestForBusiness(businessId);
    if (!subscription || !SubscriptionAccessService.isValid(subscription)) {
      throw new ForbiddenError('Active subscription required');
    }

    const plan = subscription.planId as unknown as IPlan;
    if (!plan?.limits) {
      throw new ForbiddenError('Active subscription required');
    }
    return plan;
  }

  static async getPromotionLimitsUsage(businessId: string): Promise<PromotionLimitsUsage> {
    const plan = await this.getPlanForBusiness(businessId);
    const maxBanners = plan.limits.maxBanners ?? 0;
    const maxServiceRows = plan.limits.maxServiceRows ?? 0;

    const [bannerCount, serviceRowCount, editableBanner, editableServiceRow] = await Promise.all([
      PromotionBanner.countDocuments({ businessId, isDeleted: false }),
      ServiceRow.countDocuments({ businessId, isDeleted: false }),
      PromotionBanner.findOne({ businessId, isDeleted: false }).sort({ createdAt: 1 }).select('_id'),
      ServiceRow.findOne({ businessId, isDeleted: false }).sort({ createdAt: 1 }).select('_id'),
    ]);

    return {
      maxBanners,
      maxServiceRows,
      bannerCount,
      serviceRowCount,
      canCreateBanner: bannerCount < maxBanners,
      canCreateServiceRow: serviceRowCount < maxServiceRows,
      editableBannerId: editableBanner?._id.toString() ?? null,
      editableServiceRowId: editableServiceRow?._id.toString() ?? null,
    };
  }

  static async assertServiceLimit(businessId: string): Promise<void> {
    const plan = await this.getPlanForBusiness(businessId);
    const maxServices = plan.limits.maxServices ?? 5;

    const count = await Service.countDocuments({ businessId, isDeleted: false });
    if (count >= maxServices) {
      throw new ValidationError(
        `Service limit reached (${maxServices}). Upgrade your plan to add more services.`,
      );
    }
  }

  static async assertBannerLimit(businessId: string): Promise<void> {
    const usage = await this.getPromotionLimitsUsage(businessId);
    if (!usage.canCreateBanner) {
      throw new ValidationError(
        `Banner limit reached (${usage.maxBanners}). Upgrade your plan to add more banners.`,
      );
    }
  }

  static async assertServiceRowLimit(businessId: string): Promise<void> {
    const usage = await this.getPromotionLimitsUsage(businessId);
    if (!usage.canCreateServiceRow) {
      throw new ValidationError(
        `Service row limit reached (${usage.maxServiceRows}). Upgrade your plan to add more service rows.`,
      );
    }
  }

  static async assertOwnerCanEditBanner(businessId: string, bannerId: string): Promise<void> {
    const usage = await this.getPromotionLimitsUsage(businessId);
    if (!usage.editableBannerId || usage.editableBannerId !== bannerId) {
      throw new ForbiddenError('You can only edit your primary banner. Other banners are view-only.');
    }
  }

  static async assertOwnerCanEditServiceRow(businessId: string, serviceRowId: string): Promise<void> {
    const usage = await this.getPromotionLimitsUsage(businessId);
    if (!usage.editableServiceRowId || usage.editableServiceRowId !== serviceRowId) {
      throw new ForbiddenError('You can only edit your primary service row. Other service rows are view-only.');
    }
  }
}
