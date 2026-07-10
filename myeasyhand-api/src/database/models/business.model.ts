import { Schema, model, Document, Types } from 'mongoose';

export type BusinessType =
  | 'individual'
  | 'proprietorship'
  | 'partnership'
  | 'llp'
  | 'private_limited'
  | 'other';

export type BusinessPublishStatus = 'draft' | 'published' | 'active' | 'inactive';

export interface IBusiness extends Document {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  banner?: string;
  businessType?: BusinessType;
  supportPhone?: string;
  whatsapp?: string;
  about?: string;
  companyOverview?: string;
  yearsOfExperience?: number;
  businessHours?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
    isClosed: boolean;
  }>;
  holidayNote?: string;
  emergencyServiceAvailable?: boolean;
  publishStatus?: BusinessPublishStatus;
  social?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  status: 'pending' | 'active' | 'suspended';
  ownerId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  isDeleted: boolean;
}

const businessHourSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    openTime: String,
    closeTime: String,
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    logo: String,
    banner: String,
    businessType: {
      type: String,
      enum: ['individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'other'],
    },
    supportPhone: String,
    whatsapp: String,
    about: String,
    companyOverview: String,
    yearsOfExperience: { type: Number, min: 0 },
    businessHours: [businessHourSchema],
    holidayNote: String,
    emergencyServiceAvailable: { type: Boolean, default: false },
    publishStatus: {
      type: String,
      enum: ['draft', 'published', 'active', 'inactive'],
      default: 'draft',
    },
    social: {
      website: String,
      facebook: String,
      instagram: String,
      linkedin: String,
      youtube: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

businessSchema.index({ status: 1 });

export const Business = model<IBusiness>('Business', businessSchema);
