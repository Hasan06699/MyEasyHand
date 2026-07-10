import { Schema, model, Document, Types } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  businessId: Types.ObjectId;
  customerId: Types.ObjectId;
  employeeId?: Types.ObjectId;
  serviceRating: number;
  employeeRating?: number;
  ownerRating?: number;
  title?: string;
  comment?: string;
  serviceQuality?: number;
  behaviour?: number;
  punctuality?: number;
  pricingSatisfaction?: number;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  isDeleted: boolean;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceRating: { type: Number, required: true, min: 1, max: 5 },
    employeeRating: { type: Number, min: 1, max: 5 },
    ownerRating: { type: Number, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200 },
    comment: { type: String, trim: true, maxlength: 2000 },
    serviceQuality: { type: Number, min: 1, max: 5 },
    behaviour: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    pricingSatisfaction: { type: Number, min: 1, max: 5 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Review = model<IReview>('Review', reviewSchema);
