import { Schema, model, Document, Types } from 'mongoose';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface ISubscription extends Document {
  businessId: Types.ObjectId;
  ownerId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  expiresAt: Date;
  cancelledAt?: Date;
  notes?: string;
  isDeleted: boolean;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    cancelledAt: { type: Date },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subscriptionSchema.index({ businessId: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
