import { Schema, model, Document, Types } from 'mongoose';

export type LineItemAction = 'original' | 'added' | 'removed' | 'quantity_changed';

export interface IBookingLineItem extends Document {
  bookingId: Types.ObjectId;
  serviceId: Types.ObjectId;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  action: LineItemAction;
  isDeleted: boolean;
}

const bookingLineItemSchema = new Schema<IBookingLineItem>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    notes: String,
    action: {
      type: String,
      enum: ['original', 'added', 'removed', 'quantity_changed'],
      default: 'original',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BookingLineItem = model<IBookingLineItem>('BookingLineItem', bookingLineItemSchema);
