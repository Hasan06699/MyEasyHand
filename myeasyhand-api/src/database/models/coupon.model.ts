import { Schema, model, Document, Types } from 'mongoose';

export type CouponType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_service'
  | 'cashback'
  | 'first_booking';

export type CouponStatus = 'draft' | 'active' | 'scheduled' | 'expired' | 'disabled';

export type UsageLimitType = 'unlimited' | 'total' | 'per_customer';

export type CustomerEligibility =
  | 'all'
  | 'new'
  | 'existing'
  | 'premium'
  | 'specific';

export type ServiceRestrictionType = 'all' | 'categories' | 'subcategories' | 'services';

export type VendorRestrictionType = 'all' | 'selected';

export type LocationRestrictionType = 'all' | 'cities' | 'areas';

export type AutoApplyMode = 'manual' | 'best';

export interface ICoupon extends Document {
  name: string;
  code: string;
  description?: string;
  termsAndConditions?: string;
  couponType: CouponType;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  discountAmount?: number;
  validityStartDate: Date;
  validityEndDate: Date;
  validityStartTime?: string;
  validityEndTime?: string;
  status: CouponStatus;
  usageLimitType: UsageLimitType;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  minBookingAmount?: number;
  maxBookingAmount?: number;
  customerEligibility: CustomerEligibility;
  eligibleCustomerIds?: Types.ObjectId[];
  serviceRestrictionType: ServiceRestrictionType;
  categoryIds?: Types.ObjectId[];
  subcategoryIds?: Types.ObjectId[];
  serviceIds?: Types.ObjectId[];
  vendorRestrictionType: VendorRestrictionType;
  businessIds?: Types.ObjectId[];
  locationRestrictionType: LocationRestrictionType;
  cityNames?: string[];
  areaNames?: string[];
  autoApplyMode: AutoApplyMode;
  businessId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  duplicatedFrom?: Types.ObjectId;
  isDeleted: boolean;
}

const couponSchema = new Schema<ICoupon>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    couponType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_service', 'cashback', 'first_booking'],
      required: true,
    },
    discountPercentage: { type: Number, min: 0, max: 100 },
    maxDiscountAmount: { type: Number, min: 0 },
    discountAmount: { type: Number, min: 0 },
    validityStartDate: { type: Date, required: true },
    validityEndDate: { type: Date, required: true },
    validityStartTime: { type: String, trim: true },
    validityEndTime: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'scheduled', 'expired', 'disabled'],
      default: 'draft',
    },
    usageLimitType: {
      type: String,
      enum: ['unlimited', 'total', 'per_customer'],
      default: 'unlimited',
    },
    totalUsageLimit: { type: Number, min: 1 },
    perCustomerLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    minBookingAmount: { type: Number, min: 0 },
    maxBookingAmount: { type: Number, min: 0 },
    customerEligibility: {
      type: String,
      enum: ['all', 'new', 'existing', 'premium', 'specific'],
      default: 'all',
    },
    eligibleCustomerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    serviceRestrictionType: {
      type: String,
      enum: ['all', 'categories', 'subcategories', 'services'],
      default: 'all',
    },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    subcategoryIds: [{ type: Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    vendorRestrictionType: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    businessIds: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    locationRestrictionType: {
      type: String,
      enum: ['all', 'cities', 'areas'],
      default: 'all',
    },
    cityNames: [{ type: String, trim: true }],
    areaNames: [{ type: String, trim: true }],
    autoApplyMode: {
      type: String,
      enum: ['manual', 'best'],
      default: 'manual',
    },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    duplicatedFrom: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1, businessId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
couponSchema.index({ status: 1, validityEndDate: 1 });
couponSchema.index({ businessId: 1, status: 1, isDeleted: 1 });

export const Coupon = model<ICoupon>('Coupon', couponSchema);
