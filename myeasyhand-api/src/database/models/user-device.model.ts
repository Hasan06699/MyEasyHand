import { Schema, model, Document, Types } from 'mongoose';

export type DevicePlatform = 'web' | 'admin_web' | 'android' | 'ios';

export interface IUserDevice extends Document {
  userId: Types.ObjectId;
  platform: DevicePlatform;
  onesignalSubscriptionId?: string;
  deviceLabel?: string;
  userAgent?: string;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userDeviceSchema = new Schema<IUserDevice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: {
      type: String,
      enum: ['web', 'admin_web', 'android', 'ios'],
      required: true,
    },
    onesignalSubscriptionId: { type: String, trim: true, sparse: true },
    deviceLabel: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userDeviceSchema.index(
  { userId: 1, onesignalSubscriptionId: 1 },
  { unique: true, partialFilterExpression: { onesignalSubscriptionId: { $type: 'string' } } },
);
userDeviceSchema.index({ userId: 1, platform: 1, userAgent: 1 });

export const UserDevice = model<IUserDevice>('UserDevice', userDeviceSchema);
