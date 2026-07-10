import { Schema, model, Document, Types } from 'mongoose';

export const DEFAULT_CATEGORY_ICON = 'hugeicons:legal-hammer';

export interface IServiceCategory extends Document {
  parentId?: Types.ObjectId | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
}

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', default: null, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: String,
    icon: { type: String, default: DEFAULT_CATEGORY_ICON },
    image: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

serviceCategorySchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const ServiceCategory = model<IServiceCategory>('ServiceCategory', serviceCategorySchema);
