import { Schema, model, Document, Types } from 'mongoose';

export type PlanRequestType = 'activate' | 'upgrade';
export type PlanRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IPlanRequest extends Document {
  businessId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  planId: Types.ObjectId;
  type: PlanRequestType;
  status: PlanRequestStatus;
  note?: string;
  reviewNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  subscriptionId?: Types.ObjectId;
}

const planRequestSchema = new Schema<IPlanRequest>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    type: { type: String, enum: ['activate', 'upgrade'], required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    note: { type: String, trim: true },
    reviewNote: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  },
  { timestamps: true },
);

planRequestSchema.index({ businessId: 1, status: 1 });

export const PlanRequest = model<IPlanRequest>('PlanRequest', planRequestSchema);
