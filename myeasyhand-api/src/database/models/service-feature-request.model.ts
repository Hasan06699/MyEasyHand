import { Schema, model, Document, Types } from 'mongoose';

export type FeatureRequestType = 'featured' | 'popular';
export type FeatureRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IServiceFeatureRequest extends Document {
  serviceId: Types.ObjectId;
  ownerId: Types.ObjectId;
  businessId: Types.ObjectId;
  requestType: FeatureRequestType;
  status: FeatureRequestStatus;
  remarks?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

const serviceFeatureRequestSchema = new Schema<IServiceFeatureRequest>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    requestType: { type: String, enum: ['featured', 'popular'], required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    remarks: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true },
);

serviceFeatureRequestSchema.index({ serviceId: 1, requestType: 1, status: 1 });

export const ServiceFeatureRequest = model<IServiceFeatureRequest>(
  'ServiceFeatureRequest',
  serviceFeatureRequestSchema,
);
