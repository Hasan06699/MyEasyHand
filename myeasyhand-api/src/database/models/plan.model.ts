import { Schema, model, Document } from 'mongoose';

export interface IPlanLimits {
  maxEmployees: number;
  maxServices: number;
  maxBanners?: number;
  maxServiceRows?: number;
  maxBookingsPerMonth?: number;
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  durationDays: number;
  limits: IPlanLimits;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  isDeleted: boolean;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    durationDays: { type: Number, required: true, min: 1 },
    limits: {
      maxEmployees: { type: Number, required: true, min: 0, default: 1 },
      maxServices: { type: Number, required: true, min: 0, default: 5 },
      maxBanners: { type: Number, min: 0, default: 0 },
      maxServiceRows: { type: Number, min: 0, default: 0 },
      maxBookingsPerMonth: { type: Number, min: 0 },
    },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

planSchema.index({ isActive: 1, sortOrder: 1 });

export const Plan = model<IPlan>('Plan', planSchema);
