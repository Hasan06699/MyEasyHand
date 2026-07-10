import { Schema, model, Document, Types } from 'mongoose';
import { AssignmentResponse } from '../../modules/bookings/booking.constants';

export type AssignmentStatus = 'active' | 'completed' | 'cancelled' | 'reassigned';

export interface IBookingAssignment extends Document {
  bookingId: Types.ObjectId;
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  isTeamLeader: boolean;
  employeeResponse: AssignmentResponse;
  respondedAt?: Date;
  status: AssignmentStatus;
  notes?: string;
  isDeleted: boolean;
}

const bookingAssignmentSchema = new Schema<IBookingAssignment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTeamLeader: { type: Boolean, default: false },
    employeeResponse: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    respondedAt: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'reassigned'],
      default: 'active',
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingAssignmentSchema.index({ businessId: 1, status: 1, createdAt: -1 });

export const BookingAssignment = model<IBookingAssignment>('BookingAssignment', bookingAssignmentSchema);
