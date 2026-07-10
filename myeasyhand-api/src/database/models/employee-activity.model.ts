import { Schema, model, Document, Types } from 'mongoose';

export type EmployeeActivityType =
  | 'profile_updated'
  | 'password_reset'
  | 'job_assigned'
  | 'job_started'
  | 'job_completed'
  | 'status_changed'
  | 'availability_updated'
  | 'skills_updated'
  | 'employee_created';

export interface IEmployeeActivity extends Document {
  employeeId: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  type: EmployeeActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: Types.ObjectId;
}

const employeeActivitySchema = new Schema<IEmployeeActivity>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'profile_updated',
        'password_reset',
        'job_assigned',
        'job_started',
        'job_completed',
        'status_changed',
        'availability_updated',
        'skills_updated',
        'employee_created',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

employeeActivitySchema.index({ employeeId: 1, createdAt: -1 });
employeeActivitySchema.index({ businessId: 1, createdAt: -1 });

export const EmployeeActivity = model<IEmployeeActivity>('EmployeeActivity', employeeActivitySchema);
