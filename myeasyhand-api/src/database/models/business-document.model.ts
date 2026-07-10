import { Schema, model, Document, Types } from 'mongoose';

export type BusinessDocumentCategory = 'identity' | 'business' | 'bank' | 'address' | 'employee';
export type BusinessDocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface IBusinessDocument extends Document {
  businessId: Types.ObjectId;
  ownerId: Types.ObjectId;
  category: BusinessDocumentCategory;
  type: string;
  filePath: string;
  fileName: string;
  status: BusinessDocumentStatus;
  remarks?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  expiresAt?: Date;
  isDeleted: boolean;
}

const businessDocumentSchema = new Schema<IBusinessDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['identity', 'business', 'bank', 'address', 'employee'],
      default: 'business',
      index: true,
    },
    type: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    remarks: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    expiresAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BusinessDocument = model<IBusinessDocument>('BusinessDocument', businessDocumentSchema);
