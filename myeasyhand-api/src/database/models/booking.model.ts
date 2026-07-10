import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../modules/bookings/booking.constants';

export type { BookingStatus, PaymentStatus };

export interface IVisitVerification {
  otp?: string;
  otpExpiresAt?: Date;
  qrToken?: string;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
}

export interface ICheckInOut {
  latitude?: number;
  longitude?: number;
  photos?: string[];
  notes?: string;
  at?: Date;
}

export interface ICustomerApproval {
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  requestedAt?: Date;
  respondedAt?: Date;
  draftAmount?: number;
  notes?: string;
}

export interface IBooking extends Document {
  bookingNumber: string;
  orderGroupId?: string;
  customerId: Types.ObjectId;
  businessId: Types.ObjectId;
  serviceId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  teamLeaderId?: Types.ObjectId;
  status: BookingStatus;
  scheduledAt: Date;
  visitScheduledAt?: Date;
  subtotal: number;
  discountAmount: number;
  discountType?: 'fixed' | 'percentage';
  couponCode?: string;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  technicianNotes?: string;
  visitVerification?: IVisitVerification;
  checkIn?: ICheckInOut;
  checkOut?: ICheckInOut;
  completionPhotos?: string[];
  customerSignature?: string;
  completionNotes?: string;
  customerApproval?: ICustomerApproval;
  isDeleted: boolean;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true },
    orderGroupId: { type: String, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamLeaderId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'rejected',
        'employee_assigned',
        'employee_accepted',
        'visit_scheduled',
        'visit_started',
        'service_in_progress',
        'awaiting_customer_approval',
        'approved',
        'completed',
        'paid',
        'closed',
        'cancelled',
        'no_show',
        'rescheduled',
        'refunded',
        // legacy values kept for existing records
        'confirmed',
        'in_progress',
      ],
      default: 'pending',
    },
    scheduledAt: { type: Date, required: true },
    visitScheduledAt: Date,
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    discountType: { type: String, enum: ['fixed', 'percentage'] },
    couponCode: String,
    taxAmount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial_paid', 'paid', 'failed', 'refunded', 'unpaid'],
      default: 'pending',
    },
    notes: String,
    technicianNotes: String,
    visitVerification: {
      otp: String,
      otpExpiresAt: Date,
      qrToken: String,
      verifiedAt: Date,
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    checkIn: {
      latitude: Number,
      longitude: Number,
      photos: [String],
      notes: String,
      at: Date,
    },
    checkOut: {
      latitude: Number,
      longitude: Number,
      photos: [String],
      notes: String,
      at: Date,
    },
    completionPhotos: [String],
    customerSignature: String,
    completionNotes: String,
    customerApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      },
      requestedAt: Date,
      respondedAt: Date,
      draftAmount: Number,
      notes: String,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingSchema.index({ businessId: 1, status: 1, scheduledAt: -1 });
bookingSchema.index({ orderGroupId: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
