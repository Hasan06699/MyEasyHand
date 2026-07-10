import { Schema, model, Document, Types } from 'mongoose';
import {
  PromotionLocation,
  PromotionPlatform,
  CustomerTargetType,
  PromotionStatus,
  PromotionApprovalStatus,
} from './promotion-banner.model';

export type ServiceRowBackgroundType = 'none' | 'color' | 'gradient' | 'image' | 'video';

export interface ServiceRowBackground {
  type: ServiceRowBackgroundType;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageUrl?: string;
  imageUrlWeb?: string;
  imageUrlMobile?: string;
  videoSource?: 'upload' | 'youtube';
  videoUrl?: string;
  youtubeUrl?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
}

export interface ServiceRowSpacingSides {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ServiceRowSpacingByViewport {
  web: ServiceRowSpacingSides;
  mobile: ServiceRowSpacingSides;
}

/** @deprecated use ServiceRowSpacingSides */
export type ServiceRowMargin = ServiceRowSpacingSides;
/** @deprecated use ServiceRowSpacingSides */
export type ServiceRowPadding = ServiceRowSpacingSides;

export type ServiceRowSourceType =
  | 'category'
  | 'subcategory'
  | 'selected_services'
  | 'featured'
  | 'best_selling'
  | 'top_rated'
  | 'new_services';

export interface IServiceRow extends Document {
  rowName: string;
  displayOrder: number;
  isActive: boolean;
  status: PromotionStatus;
  approvalStatus: PromotionApprovalStatus;
  requestedStatus?: PromotionStatus;
  startDate?: Date;
  endDate?: Date;
  background: ServiceRowBackground;
  rowMargin: ServiceRowSpacingByViewport;
  rowPadding: ServiceRowSpacingByViewport;
  rowTitle: string;
  rowSubtitle?: string;
  serviceSourceType: ServiceRowSourceType;
  categoryId?: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  serviceIds?: Types.ObjectId[];
  maxItems: number;
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

const serviceRowSchema = new Schema<IServiceRow>(
  {
    rowName: { type: String, required: true, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
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
    startDate: { type: Date },
    endDate: { type: Date },
    background: {
      type: {
        type: String,
        enum: ['none', 'color', 'gradient', 'image', 'video'],
        default: 'none',
      },
      color: { type: String, trim: true },
      gradientStart: { type: String, trim: true },
      gradientEnd: { type: String, trim: true },
      gradientAngle: { type: Number, default: 90, min: 0, max: 360 },
      imageUrl: { type: String, trim: true },
      imageUrlWeb: { type: String, trim: true },
      imageUrlMobile: { type: String, trim: true },
      videoSource: { type: String, enum: ['upload', 'youtube'], default: 'upload' },
      videoUrl: { type: String, trim: true },
      youtubeUrl: { type: String, trim: true },
      videoAutoplay: { type: Boolean, default: true },
      videoMuted: { type: Boolean, default: true },
    },
    rowMargin: {
      web: {
        top: { type: Number, default: 0, min: 0 },
        bottom: { type: Number, default: 0, min: 0 },
        left: { type: Number, default: 0, min: 0 },
        right: { type: Number, default: 0, min: 0 },
      },
      mobile: {
        top: { type: Number, default: 0, min: 0 },
        bottom: { type: Number, default: 0, min: 0 },
        left: { type: Number, default: 0, min: 0 },
        right: { type: Number, default: 0, min: 0 },
      },
    },
    rowPadding: {
      web: {
        top: { type: Number, default: 16, min: 0 },
        bottom: { type: Number, default: 16, min: 0 },
        left: { type: Number, default: 16, min: 0 },
        right: { type: Number, default: 16, min: 0 },
      },
      mobile: {
        top: { type: Number, default: 16, min: 0 },
        bottom: { type: Number, default: 16, min: 0 },
        left: { type: Number, default: 16, min: 0 },
        right: { type: Number, default: 16, min: 0 },
      },
    },
    rowTitle: { type: String, required: true, trim: true },
    rowSubtitle: { type: String, trim: true },
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
      required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    maxItems: { type: Number, default: 10, min: 1, max: 50 },
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

serviceRowSchema.index({ businessId: 1, isActive: 1, isDeleted: 1 });
serviceRowSchema.index({ displayOrder: 1 });

export const ServiceRow = model<IServiceRow>('ServiceRow', serviceRowSchema);
