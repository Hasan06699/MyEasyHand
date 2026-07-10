import { Schema, model, Document, Types } from 'mongoose';

export const DEFAULT_SERVICE_ICON = 'solar:box-minimalistic-linear';

export type PriceType = 'fixed' | 'hourly' | 'quote-based';
export type DurationUnit = 'minute' | 'hour' | 'day';
export type ServiceStatus = 'active' | 'inactive' | 'draft' | 'pending';

export interface IService extends Document {
  businessId: Types.ObjectId;
  parentCategoryId: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  name: string;
  slug: string;
  serviceCode?: string;
  shortDescription: string;
  fullDescription?: string;
  icon?: string;
  image: string;
  basePrice?: number;
  mrp?: number;
  salePrice?: number;
  discountPercent?: number;
  discountExpiresAt?: Date;
  priceType: PriceType;
  duration?: number;
  durationUnit?: DurationUnit;
  gstPercentage?: number;
  isFeatured: boolean;
  isPopular: boolean;
  status: ServiceStatus;
  displayOrder: number;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
}

const serviceSchema = new Schema<IService>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', index: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    slug: { type: String, required: true, lowercase: true, maxlength: 255 },
    serviceCode: { type: String, trim: true, maxlength: 50 },
    shortDescription: { type: String, required: true },
    fullDescription: String,
    icon: { type: String, maxlength: 500, default: DEFAULT_SERVICE_ICON },
    image: { type: String, required: true, maxlength: 500 },
    basePrice: { type: Number, min: 0 },
    mrp: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    discountExpiresAt: Date,
    priceType: { type: String, enum: ['fixed', 'hourly', 'quote-based'], required: true, default: 'fixed' },
    duration: { type: Number, min: 1 },
    durationUnit: { type: String, enum: ['minute', 'hour', 'day'] },
    gstPercentage: { type: Number, min: 0, max: 100 },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'pending'],
      default: 'pending',
      required: true,
    },
    displayOrder: { type: Number, default: 0 },
    metaTitle: { type: String, maxlength: 255 },
    metaKeywords: String,
    metaDescription: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

serviceSchema.index({ businessId: 1, slug: 1 }, { unique: true });
serviceSchema.index({ serviceCode: 1 }, { unique: true, sparse: true });
serviceSchema.index({ status: 1, displayOrder: 1 });
serviceSchema.index({ isFeatured: 1, isPopular: 1 });

export const Service = model<IService>('Service', serviceSchema);
