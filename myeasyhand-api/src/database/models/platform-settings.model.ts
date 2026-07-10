import { Schema, model, Document } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  auth: {
    otpVerificationEnabled: boolean;
    googleLoginEnabled: boolean;
  };
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'platform' },
    auth: {
      otpVerificationEnabled: { type: Boolean, default: true },
      googleLoginEnabled: { type: Boolean, default: false },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const PlatformSettings = model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
