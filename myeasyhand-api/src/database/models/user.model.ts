import { Schema, model, Document, Types } from 'mongoose';
import { RoleSlug } from '../../common/types/express';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  passwordHash?: string;
  recoverablePassword?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  roleSlugs: RoleSlug[];
  businessId?: Types.ObjectId;
  lastLoginAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    recoverablePassword: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: String,
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    roleSlugs: {
      type: [{ type: String, enum: ['super_admin', 'business_owner', 'employee', 'customer'] }],
      default: ['customer'],
    },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
    lastLoginAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ businessId: 1, status: 1 });

export const User = model<IUser>('User', userSchema);
