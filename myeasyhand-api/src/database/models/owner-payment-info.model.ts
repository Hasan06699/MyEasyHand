import { Schema, model, Document, Types } from 'mongoose';

export type SettlementFrequency = 'daily' | 'weekly' | 'monthly';
export type BankAccountType = 'savings' | 'current';
export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface IOwnerPaymentInfo extends Document {
  businessId: Types.ObjectId;
  ownerId: Types.ObjectId;
  bankAccount?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountType?: BankAccountType;
  };
  upi?: {
    upiId?: string;
    qrCodeUrl?: string;
  };
  payout?: {
    automaticSettlement?: boolean;
    manualWithdrawal?: boolean;
    settlementFrequency?: SettlementFrequency;
  };
  tax?: {
    gstNumber?: string;
    panNumber?: string;
    taxCertificateUrl?: string;
  };
  bankVerificationStatus: VerificationStatus;
}

const ownerPaymentInfoSchema = new Schema<IOwnerPaymentInfo>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bankAccount: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String,
      accountType: { type: String, enum: ['savings', 'current'] },
    },
    upi: {
      upiId: String,
      qrCodeUrl: String,
    },
    payout: {
      automaticSettlement: { type: Boolean, default: true },
      manualWithdrawal: { type: Boolean, default: false },
      settlementFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    },
    tax: {
      gstNumber: String,
      panNumber: String,
      taxCertificateUrl: String,
    },
    bankVerificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const OwnerPaymentInfo = model<IOwnerPaymentInfo>('OwnerPaymentInfo', ownerPaymentInfoSchema);
