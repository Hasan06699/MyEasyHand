import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerCartItem {
  serviceId: Types.ObjectId;
  quantity: number;
  notes?: string;
}

export interface ICustomerCart extends Document {
  userId: Types.ObjectId;
  items: ICustomerCartItem[];
  scheduledAt?: string;
  notes?: string;
  couponCode?: string;
  cityName?: string;
  areaName?: string;
}

const customerCartItemSchema = new Schema<ICustomerCartItem>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const customerCartSchema = new Schema<ICustomerCart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [customerCartItemSchema], default: [] },
    scheduledAt: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    couponCode: { type: String, trim: true, maxlength: 50 },
    cityName: { type: String, trim: true, maxlength: 120 },
    areaName: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: true },
);

export const CustomerCart = model<ICustomerCart>('CustomerCart', customerCartSchema);
