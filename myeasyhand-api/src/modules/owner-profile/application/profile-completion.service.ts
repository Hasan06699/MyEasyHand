import { IUser } from '../../../database/models/user.model';
import { IOwnerProfile } from '../../../database/models/owner-profile.model';
import { IBusiness } from '../../../database/models/business.model';
import { IOwnerPaymentInfo } from '../../../database/models/owner-payment-info.model';
import { IBusinessDocument } from '../../../database/models/business-document.model';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  return false;
}

function sectionPercent(filledCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((filledCount / total) * 100);
}

export interface ProfileCompletion {
  personal: number;
  business: number;
  payment: number;
  documents: number;
  overall: number;
}

export interface VerificationBadges {
  emailVerified: boolean;
  mobileVerified: boolean;
  kycVerified: boolean;
  gstVerified: boolean;
  businessVerified: boolean;
  premiumPartner: boolean;
}

export class ProfileCompletionService {
  static calculatePersonal(user: IUser, profile: IOwnerProfile | null): number {
    const checks = [
      filled(user.avatar),
      filled(user.firstName),
      filled(user.lastName),
      filled(profile?.displayName),
      filled(user.phone),
      filled(profile?.alternatePhone),
      filled(user.email),
      filled(profile?.dateOfBirth),
      filled(profile?.gender),
      filled(profile?.username),
      filled(profile?.address?.country),
      filled(profile?.address?.state),
      filled(profile?.address?.city),
      filled(profile?.address?.area),
      filled(profile?.address?.completeAddress),
      filled(profile?.address?.postalCode),
      filled(profile?.preferences?.language),
      filled(profile?.preferences?.timezone),
    ];
    return sectionPercent(checks.filter(Boolean).length, checks.length);
  }

  static calculateBusiness(business: IBusiness | null): number {
    if (!business) return 0;
    const checks = [
      filled(business.logo),
      filled(business.banner),
      filled(business.name),
      filled(business.businessType),
      filled(business.phone),
      filled(business.email),
      filled(business.supportPhone),
      filled(business.whatsapp),
      filled(business.address?.street),
      filled(business.address?.city),
      filled(business.address?.state),
      filled(business.address?.country),
      filled(business.address?.zip),
      filled(business.about),
      filled(business.companyOverview),
      filled(business.yearsOfExperience),
      (business.businessHours?.length ?? 0) > 0,
      filled(business.social?.website),
    ];
    return sectionPercent(checks.filter(Boolean).length, checks.length);
  }

  static calculatePayment(payment: IOwnerPaymentInfo | null): number {
    if (!payment) return 0;
    const checks = [
      filled(payment.bankAccount?.accountHolderName),
      filled(payment.bankAccount?.bankName),
      filled(payment.bankAccount?.accountNumber),
      filled(payment.bankAccount?.ifscCode),
      filled(payment.bankAccount?.branchName),
      filled(payment.bankAccount?.accountType),
      filled(payment.upi?.upiId),
      filled(payment.tax?.gstNumber),
      filled(payment.tax?.panNumber),
      payment.payout?.automaticSettlement !== undefined,
      filled(payment.payout?.settlementFrequency),
    ];
    return sectionPercent(checks.filter(Boolean).length, checks.length);
  }

  static calculateDocuments(documents: IBusinessDocument[]): number {
    const categories: Array<IBusinessDocument['category']> = [
      'identity',
      'business',
      'bank',
      'address',
    ];
    const approved = categories.filter((cat) =>
      documents.some((doc) => doc.category === cat && doc.status === 'approved'),
    );
    const uploaded = categories.filter((cat) =>
      documents.some((doc) => doc.category === cat),
    );
    const approvedScore = sectionPercent(approved.length, categories.length);
    const uploadedScore = sectionPercent(uploaded.length, categories.length);
    return Math.round((approvedScore * 0.7 + uploadedScore * 0.3));
  }

  static calculateAll(
    user: IUser,
    profile: IOwnerProfile | null,
    business: IBusiness | null,
    payment: IOwnerPaymentInfo | null,
    documents: IBusinessDocument[],
  ): ProfileCompletion {
    const personal = this.calculatePersonal(user, profile);
    const businessScore = this.calculateBusiness(business);
    const paymentScore = this.calculatePayment(payment);
    const documentsScore = this.calculateDocuments(documents);
    const overall = Math.round((personal + businessScore + paymentScore + documentsScore) / 4);

    return {
      personal,
      business: businessScore,
      payment: paymentScore,
      documents: documentsScore,
      overall,
    };
  }

  static getBadges(
    user: IUser,
    profile: IOwnerProfile | null,
    business: IBusiness | null,
    payment: IOwnerPaymentInfo | null,
    documents: IBusinessDocument[],
    hasPremiumSubscription: boolean,
  ): VerificationBadges {
    const gstDocApproved = documents.some(
      (doc) => doc.type === 'GST Certificate' && doc.status === 'approved',
    );

    return {
      emailVerified: user.isEmailVerified,
      mobileVerified: user.isPhoneVerified,
      kycVerified: profile?.kycStatus === 'approved',
      gstVerified: gstDocApproved || filled(payment?.tax?.gstNumber),
      businessVerified: business?.status === 'active' && business?.publishStatus === 'active',
      premiumPartner: hasPremiumSubscription,
    };
  }
}
