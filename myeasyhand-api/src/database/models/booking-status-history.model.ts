import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus } from '../../modules/bookings/booking.constants';

export interface IBookingStatusHistory extends Document {
  bookingId: Types.ObjectId;
  businessId: Types.ObjectId;
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  changedBy: Types.ObjectId;
  notes?: string;
}

const bookingStatusHistorySchema = new Schema<IBookingStatusHistory>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String,
  },
  { timestamps: true },
);

export const BookingStatusHistory = model<IBookingStatusHistory>(
  'BookingStatusHistory',
  bookingStatusHistorySchema,
);
