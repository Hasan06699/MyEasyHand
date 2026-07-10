import { Schema, model, Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
  slug: string;
  state?: string;
  country: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
}

const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true, unique: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, default: 'India', trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

citySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
citySchema.index({ name: 1, state: 1 });

export const City = model<ICity>('City', citySchema);
