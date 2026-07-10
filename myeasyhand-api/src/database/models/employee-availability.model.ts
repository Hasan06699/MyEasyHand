import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployeeAvailability extends Document {
  employeeId: Types.ObjectId;
  businessId: Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isDeleted: boolean;
}

const employeeAvailabilitySchema = new Schema<IEmployeeAvailability>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

employeeAvailabilitySchema.index({ employeeId: 1, dayOfWeek: 1 });

export const EmployeeAvailability = model<IEmployeeAvailability>(
  'EmployeeAvailability',
  employeeAvailabilitySchema,
);
