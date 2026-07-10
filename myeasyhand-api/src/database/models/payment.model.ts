import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../modules/bookings/booking.constants';

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  businessId: Types.ObjectId;
  customerId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  notes?: string;
  recordedBy: Types.ObjectId;
  isDeleted: boolean;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'upi', 'credit_card', 'debit_card', 'net_banking', 'wallet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'partial_paid', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionRef: String,
    notes: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);
