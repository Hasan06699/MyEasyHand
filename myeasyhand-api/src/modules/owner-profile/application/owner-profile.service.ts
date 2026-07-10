import { Types } from 'mongoose';
import { Request } from 'express';
import { User, IUser } from '../../../database/models/user.model';
import { OwnerProfile, IOwnerProfile } from '../../../database/models/owner-profile.model';
import { Business, IBusiness } from '../../../database/models/business.model';
import { OwnerPaymentInfo, IOwnerPaymentInfo } from '../../../database/models/owner-payment-info.model';
import { BusinessDocument } from '../../../database/models/business-document.model';
import { Session } from '../../../database/models/session.model';
import { Booking } from '../../../database/models/booking.model';
import { Subscription } from '../../../database/models/subscription.model';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors/AppError';
import { TokenService } from '../../../services/otp.service';
import { NotificationService } from '../../../services/notification.service';
import { ProfileCompletionService } from './profile-completion.service';
import { Notification } from '../../../database/models/notification.model';

const DEFAULT_BUSINESS_HOURS = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: dayOfWeek === 0,
}));

export class OwnerProfileService {
  static assertOwner(req: Request) {
    if (!req.user?.roles.includes('business_owner') || !req.user.businessId) {
      throw new ForbiddenError('Only business owners can access owner profile');
    }
    return { userId: req.user.id, businessId: req.user.businessId };
  }

  static async getOrCreateProfile(userId: string): Promise<IOwnerProfile> {
    let profile = await OwnerProfile.findOne({ userId });
    if (!profile) {
      profile = await OwnerProfile.create({ userId: new Types.ObjectId(userId) });
    }
    return profile;
  }

  static async getOrCreatePayment(businessId: string, ownerId: string): Promise<IOwnerPaymentInfo> {
    let payment = await OwnerPaymentInfo.findOne({ businessId });
    if (!payment) {
      payment = await OwnerPaymentInfo.create({
        businessId: new Types.ObjectId(businessId),
        ownerId: new Types.ObjectId(ownerId),
      });
    }
    return payment;
  }

  static async getOverview(req: Request) {
    const { userId, businessId } = this.assertOwner(req);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const [profile, business, payment, documents, subscription] = await Promise.all([
      this.getOrCreateProfile(userId),
      Business.findOne({ _id: businessId, isDeleted: false }),
      this.getOrCreatePayment(businessId, userId),
      BusinessDocument.find({ businessId, isDeleted: false }),
      Subscription.findOne({ businessId, status: { $in: ['active', 'trial'] } }),
    ]);

    const completion = ProfileCompletionService.calculateAll(
      user,
      profile,
      business,
      payment,
      documents,
    );
    const badges = ProfileCompletionService.getBadges(
      user,
      profile,
      business,
      payment,
      documents,
      !!subscription,
    );

    return {
      user: this.sanitizeUser(user),
      profile,
      business,
      payment,
      completion,
      badges,
      kycStatus: profile.kycStatus,
      accountStatus: profile.accountStatus,
      businessStatus: business?.status,
      publishStatus: business?.publishStatus,
    };
  }

  static async updatePersonal(
    req: Request,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
      displayName?: string;
      alternatePhone?: string;
      dateOfBirth?: string;
      gender?: string;
      username?: string;
    },
  ) {
    const { userId } = this.assertOwner(req);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (data.username) {
      const existing = await OwnerProfile.findOne({
        username: data.username.toLowerCase(),
        userId: { $ne: userId },
      });
      if (existing) throw new ConflictError('Username already taken');
    }

    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.avatar !== undefined) user.avatar = data.avatar || undefined;
    await user.save();

    const profile = await this.getOrCreateProfile(userId);
    if (data.displayName !== undefined) profile.displayName = data.displayName || undefined;
    if (data.alternatePhone !== undefined) profile.alternatePhone = data.alternatePhone || undefined;
    if (data.dateOfBirth !== undefined) {
      profile.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    }
    if (data.gender !== undefined) profile.gender = (data.gender as IOwnerProfile['gender']) || undefined;
    if (data.username !== undefined) profile.username = data.username?.toLowerCase() || undefined;
    await profile.save();

    await this.maybeNotifyProfileIncomplete(req, userId);
    return { user: this.sanitizeUser(user), profile };
  }

  static async updateAddress(
    req: Request,
    address: {
      country?: string;
      state?: string;
      city?: string;
      area?: string;
      completeAddress?: string;
      postalCode?: string;
    },
  ) {
    const { userId } = this.assertOwner(req);
    const profile = await this.getOrCreateProfile(userId);
    profile.address = { ...profile.address, ...address };
    await profile.save();
    await this.maybeNotifyProfileIncomplete(req, userId);
    return profile;
  }

  static async updatePreferences(
    req: Request,
    preferences: {
      language?: string;
      timezone?: string;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      pushNotifications?: boolean;
    },
  ) {
    const { userId } = this.assertOwner(req);
    const profile = await this.getOrCreateProfile(userId);
    profile.preferences = { ...profile.preferences, ...preferences };
    await profile.save();
    return profile;
  }

  static async updateAccountSettings(
    req: Request,
    data: { twoFactorEnabled?: boolean },
  ) {
    const { userId } = this.assertOwner(req);
    const profile = await this.getOrCreateProfile(userId);
    if (data.twoFactorEnabled !== undefined) profile.twoFactorEnabled = data.twoFactorEnabled;
    await profile.save();
    return profile;
  }

  static async changePassword(req: Request, currentPassword: string, newPassword: string) {
    const { userId } = this.assertOwner(req);
    const user = await User.findById(userId).select('+passwordHash');
    if (!user?.passwordHash) throw new NotFoundError('User not found');

    const valid = await TokenService.comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect');

    user.passwordHash = await TokenService.hashPassword(newPassword);
    await user.save();
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    return { message: 'Password changed successfully' };
  }

  static async getLoginActivity(req: Request) {
    const { userId } = this.assertOwner(req);
    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('deviceInfo expiresAt isRevoked createdAt updatedAt');

    const user = await User.findById(userId).select('lastLoginAt');
    return { lastLoginAt: user?.lastLoginAt, sessions };
  }

  static async updateBusiness(req: Request, data: Partial<IBusiness>) {
    const { userId, businessId } = this.assertOwner(req);
    const business = await Business.findOne({ _id: businessId, ownerId: userId, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    const allowed = [
      'name', 'email', 'phone', 'logo', 'banner', 'businessType', 'supportPhone', 'whatsapp',
      'about', 'companyOverview', 'yearsOfExperience', 'businessHours', 'holidayNote',
      'emergencyServiceAvailable', 'publishStatus', 'social', 'address',
    ] as const;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        (business as unknown as Record<string, unknown>)[key] = data[key];
      }
    }

    if (!business.businessHours?.length) {
      business.businessHours = DEFAULT_BUSINESS_HOURS;
    }

    await business.save();
    await this.maybeNotifyProfileIncomplete(req, userId);
    return business;
  }

  static async getPayment(req: Request) {
    const { userId, businessId } = this.assertOwner(req);
    return this.getOrCreatePayment(businessId, userId);
  }

  static async updatePayment(req: Request, data: Partial<IOwnerPaymentInfo>) {
    const { userId, businessId } = this.assertOwner(req);
    const payment = await this.getOrCreatePayment(businessId, userId);

    if (data.bankAccount) payment.bankAccount = { ...payment.bankAccount, ...data.bankAccount };
    if (data.upi) payment.upi = { ...payment.upi, ...data.upi };
    if (data.payout) payment.payout = { ...payment.payout, ...data.payout };
    if (data.tax) payment.tax = { ...payment.tax, ...data.tax };

    if (data.bankAccount && Object.values(data.bankAccount).some(Boolean)) {
      payment.bankVerificationStatus = 'under_review';
    }

    await payment.save();
    await this.maybeNotifyProfileIncomplete(req, userId);
    return payment;
  }

  static async getEarnings(req: Request) {
    const { businessId } = this.assertOwner(req);
    const filter = { businessId: new Types.ObjectId(businessId), isDeleted: { $ne: true } };

    const [totals, pendingBookings, settlements] = await Promise.all([
      Booking.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$paidAmount' },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]),
      Booking.countDocuments({ ...filter, paymentStatus: { $in: ['pending', 'partial'] } }),
      Booking.find({ ...filter, paymentStatus: 'paid' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('bookingNumber paidAmount totalAmount paymentStatus updatedAt'),
    ]);

    const totalEarnings = totals[0]?.totalEarnings ?? 0;
    const totalRevenue = totals[0]?.totalRevenue ?? 0;
    const pendingPayments = totalRevenue - totalEarnings;

    return {
      totalEarnings,
      pendingPayments: Math.max(0, pendingPayments),
      withdrawableBalance: totalEarnings,
      settlementHistory: settlements,
      pendingBookingsCount: pendingBookings,
    };
  }

  private static sanitizeUser(user: IUser) {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      roleSlugs: user.roleSlugs,
      businessId: user.businessId?.toString(),
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private static async maybeNotifyProfileIncomplete(req: Request, userId: string) {
    const overview = await this.getOverview(req);
    if (overview.completion.overall >= 80) return;

    const alreadySent = await Notification.exists({
      userId,
      type: 'profile_incomplete',
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (alreadySent) return;

    await NotificationService.notify({
      userId,
      businessId: req.user?.businessId,
      type: 'profile_incomplete',
      title: 'Complete your profile',
      body: `Your profile is ${overview.completion.overall}% complete. Finish setup to unlock all features.`,
      data: { completion: overview.completion },
    });
  }
}
