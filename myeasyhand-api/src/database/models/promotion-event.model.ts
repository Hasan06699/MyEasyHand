import { Schema, model, Document, Types } from 'mongoose';

export type PromotionEntityType = 'banner' | 'service_row';

export type PromotionEventType =
  | 'view'
  | 'click'
  | 'coupon_use'
  | 'booking_conversion';

export interface IPromotionEvent extends Document {
  entityType: PromotionEntityType;
  entityId: Types.ObjectId;
  eventType: PromotionEventType;
  customerId?: Types.ObjectId;
  businessId?: Types.ObjectId;
  couponId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  revenue?: number;
  metadata?: Record<string, unknown>;
}

const promotionEventSchema = new Schema<IPromotionEvent>(
  {
    entityType: { type: String, enum: ['banner', 'service_row'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventType: {
      type: String,
      enum: ['view', 'click', 'coupon_use', 'booking_conversion'],
      required: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    revenue: { type: Number, min: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

promotionEventSchema.index({ entityType: 1, entityId: 1, eventType: 1 });
promotionEventSchema.index({ createdAt: -1 });

export const PromotionEvent = model<IPromotionEvent>('PromotionEvent', promotionEventSchema);
