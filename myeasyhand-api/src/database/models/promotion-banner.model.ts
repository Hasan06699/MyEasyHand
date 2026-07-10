import { Schema, model, Document, Types } from 'mongoose';

export type PromotionStatus = 'draft' | 'active' | 'inactive';

export type PromotionApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type BannerLayoutType = 'standard' | 'offer' | 'html_landing';

export type BannerType = 'services' | 'link' | 'html' | 'coupon';

export type BannerTextPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type BannerServiceSourceType =
  | 'category'
  | 'subcategory'
  | 'selected_services'
  | 'featured'
  | 'best_selling'
  | 'top_rated'
  | 'new_services';

export type RedirectionType =
  | 'category'
  | 'subcategory'
  | 'service'
  | 'external_url'
  | 'custom_landing_page';

export type ServiceSourceType = BannerServiceSourceType;

export type PromotionLocation =
  | 'home'
  | 'category'
  | 'search'
  | 'service_details'
  | 'campaign';

export type PromotionPlatform = 'mobile_app' | 'website' | 'owner_dashboard';

export type CustomerTargetType = 'all' | 'new' | 'existing' | 'premium';

export interface IPromotionBanner extends Document {
  name: string;
  status: PromotionStatus;
  approvalStatus: PromotionApprovalStatus;
  requestedStatus?: PromotionStatus;
  startDate: Date;
  endDate: Date;
  priorityOrder: number;
  bannerImageWeb: string;
  bannerImageMobile?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerType: BannerType;
  showImageOnly: boolean;
  textPosition: BannerTextPosition;
  linkUrl?: string;
  htmlContent?: string;
  maxItems: number;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  couponId?: Types.ObjectId;
  bannerLayoutType: BannerLayoutType;
  redirectionType?: RedirectionType;
  redirectionTargetId?: Types.ObjectId;
  redirectionUrl?: string;
  serviceSourceType?: ServiceSourceType;
  categoryId?: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  serviceIds?: Types.ObjectId[];
  platforms: PromotionPlatform[];
  locations: PromotionLocation[];
  targetCountries?: string[];
  targetStates?: string[];
  targetCities?: string[];
  customerTargetType: CustomerTargetType;
  targetCategoryIds?: Types.ObjectId[];
  targetServiceIds?: Types.ObjectId[];
  viewCount: number;
  clickCount: number;
  businessId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
}

const promotionBannerSchema = new Schema<IPromotionBanner>(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'approved',
    },
    requestedStatus: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priorityOrder: { type: Number, default: 0 },
    bannerImageWeb: { type: String, required: true, trim: true },
    bannerImageMobile: { type: String, trim: true },
    bannerTitle: { type: String, trim: true },
    bannerSubtitle: { type: String, trim: true },
    bannerType: {
      type: String,
      enum: ['services', 'link', 'html', 'coupon'],
      default: 'services',
    },
    showImageOnly: { type: Boolean, default: false },
    textPosition: {
      type: String,
      enum: [
        'top-left',
        'top-center',
        'top-right',
        'center-left',
        'center',
        'center-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
        'left',
        'right',
      ],
      default: 'center-left',
    },
    linkUrl: { type: String, trim: true },
    htmlContent: { type: String },
    maxItems: { type: Number, default: 10, min: 1, max: 50 },
    ctaButtonText: { type: String, trim: true },
    ctaButtonLink: { type: String, trim: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    bannerLayoutType: {
      type: String,
      enum: ['standard', 'offer', 'html_landing'],
      default: 'standard',
    },
    redirectionType: {
      type: String,
      enum: ['category', 'subcategory', 'service', 'external_url', 'custom_landing_page'],
    },
    redirectionTargetId: { type: Schema.Types.ObjectId },
    redirectionUrl: { type: String, trim: true },
    serviceSourceType: {
      type: String,
      enum: [
        'category',
        'subcategory',
        'selected_services',
        'featured',
        'best_selling',
        'top_rated',
        'new_services',
      ],
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    platforms: {
      type: [{ type: String, enum: ['mobile_app', 'website', 'owner_dashboard'] }],
      default: ['mobile_app', 'website'],
    },
    locations: {
      type: [{ type: String, enum: ['home', 'category', 'search', 'service_details', 'campaign'] }],
      default: ['home'],
    },
    targetCountries: [{ type: String, trim: true }],
    targetStates: [{ type: String, trim: true }],
    targetCities: [{ type: String, trim: true }],
    customerTargetType: {
      type: String,
      enum: ['all', 'new', 'existing', 'premium'],
      default: 'all',
    },
    targetCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    targetServiceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    viewCount: { type: Number, default: 0, min: 0 },
    clickCount: { type: Number, default: 0, min: 0 },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

promotionBannerSchema.index({ businessId: 1, status: 1, isDeleted: 1 });
promotionBannerSchema.index({ status: 1, startDate: 1, endDate: 1, priorityOrder: -1 });

export const PromotionBanner = model<IPromotionBanner>('PromotionBanner', promotionBannerSchema);
