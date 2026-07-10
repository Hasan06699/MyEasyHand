import { Schema, model, Document, Types } from 'mongoose';

export interface IServiceOwnerSettings extends Document {
  ownerId: Types.ObjectId;
  businessId: Types.ObjectId;
  autoApproveServices: boolean;
  updatedBy?: Types.ObjectId;
}

const serviceOwnerSettingsSchema = new Schema<IServiceOwnerSettings>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, unique: true },
    autoApproveServices: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ServiceOwnerSettings = model<IServiceOwnerSettings>(
  'ServiceOwnerSettings',
  serviceOwnerSettingsSchema,
);
