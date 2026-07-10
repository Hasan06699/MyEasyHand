import { Schema, model, Document, Types } from 'mongoose';

export type EmployeeType = 'office_staff' | 'service_staff';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface IEmployee extends Document {
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  employeeCode: string;
  employeeType: EmployeeType;
  designation: string;
  department?: string;
  hireDate?: Date;
  status: EmployeeStatus;
  notes?: string;
  isDeleted: boolean;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    employeeCode: { type: String, required: true, trim: true },
    employeeType: {
      type: String,
      enum: ['office_staff', 'service_staff'],
      required: true,
    },
    designation: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    hireDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'terminated'],
      default: 'active',
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

employeeSchema.index({ businessId: 1, status: 1 });
employeeSchema.index({ businessId: 1, employeeType: 1 });
employeeSchema.index({ businessId: 1, employeeCode: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Employee = model<IEmployee>('Employee', employeeSchema);
