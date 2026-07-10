import { Schema, model, Document, Types } from 'mongoose';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type AccountStatus = 'pending_verification' | 'active' | 'suspended' | 'blocked';

export interface IOwnerProfile extends Document {
  userId: Types.ObjectId;
  displayName?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  username?: string;
  twoFactorEnabled: boolean;
  address?: {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    completeAddress?: string;
    postalCode?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
}

const ownerProfileSchema = new Schema<IOwnerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    displayName: String,
    alternatePhone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    username: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    twoFactorEnabled: { type: Boolean, default: false },
    address: {
      country: String,
      state: String,
      city: String,
      area: String,
      completeAddress: String,
      postalCode: String,
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    accountStatus: {
      type: String,
      enum: ['pending_verification', 'active', 'suspended', 'blocked'],
      default: 'pending_verification',
    },
  },
  { timestamps: true },
);

export const OwnerProfile = model<IOwnerProfile>('OwnerProfile', ownerProfileSchema);
