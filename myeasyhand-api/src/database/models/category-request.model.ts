import { Schema, model, Document, Types } from 'mongoose';

export type CategoryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ICategoryRequest extends Document {
  businessId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  name: string;
  description?: string;
  parentId?: Types.ObjectId | null;
  icon?: string;
  image?: string;
  sortOrder: number;
  status: CategoryRequestStatus;
  reviewNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  categoryId?: Types.ObjectId;
}

const categoryRequestSchema = new Schema<ICategoryRequest>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    parentId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', default: null },
    icon: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewNote: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
  },
  { timestamps: true },
);

categoryRequestSchema.index({ businessId: 1, status: 1 });

export const CategoryRequest = model<ICategoryRequest>('CategoryRequest', categoryRequestSchema);
