import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  adminId?: Types.ObjectId;
  ownerId?: Types.ObjectId;
  businessId?: Types.ObjectId;
  module: string;
  action: string;
  resourceId?: Types.ObjectId;
  approvalStatus?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    module: { type: String, required: true, index: true },
    action: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    approvalStatus: String,
    remarks: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
