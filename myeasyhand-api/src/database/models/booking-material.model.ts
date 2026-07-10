import { Schema, model, Document, Types } from 'mongoose';

export type MaterialType = 'spare_part' | 'consumable';

export interface IBookingMaterial extends Document {
  bookingId: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  type: MaterialType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedBy: Types.ObjectId;
  notes?: string;
  isDeleted: boolean;
}

const bookingMaterialSchema = new Schema<IBookingMaterial>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['spare_part', 'consumable'], required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BookingMaterial = model<IBookingMaterial>('BookingMaterial', bookingMaterialSchema);
