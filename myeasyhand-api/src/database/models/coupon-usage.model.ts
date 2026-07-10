import { Schema, model, Document, Types } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: Types.ObjectId;
  customerId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  orderGroupId?: string;
  businessId?: Types.ObjectId;
  discountApplied: number;
  cashbackAmount?: number;
  referrerCredit?: number;
  status: 'pending' | 'completed';
  referralCode?: string;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    orderGroupId: { type: String, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    discountApplied: { type: Number, default: 0, min: 0 },
    cashbackAmount: { type: Number, min: 0 },
    referrerCredit: { type: Number, min: 0 },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
    referralCode: { type: String, trim: true },
  },
  { timestamps: true },
);

couponUsageSchema.index({ couponId: 1, customerId: 1 });

export const CouponUsage = model<ICouponUsage>('CouponUsage', couponUsageSchema);
