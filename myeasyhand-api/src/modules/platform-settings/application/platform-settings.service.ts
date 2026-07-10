import { Types } from 'mongoose';
import { PlatformSettings } from '../../../database/models/platform-settings.model';

export interface PublicAuthSettings {
  otpVerificationEnabled: boolean;
  googleLoginEnabled: boolean;
  googleClientId?: string;
}

export class PlatformSettingsService {
  static async getOrCreate() {
    let doc = await PlatformSettings.findOne({ key: 'platform' });
    if (!doc) {
      doc = await PlatformSettings.create({ key: 'platform' });
    }
    return doc;
  }

  static async getPublicAuthSettings(): Promise<PublicAuthSettings> {
    const doc = await this.getOrCreate();
    const clientIds = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      otpVerificationEnabled: doc.auth.otpVerificationEnabled,
      googleLoginEnabled: doc.auth.googleLoginEnabled,
      googleClientId: clientIds[0] || undefined,
    };
  }

  static async updateAuthSettings(
    data: { otpVerificationEnabled?: boolean; googleLoginEnabled?: boolean },
    updatedBy: string,
  ) {
    const doc = await this.getOrCreate();
    if (data.otpVerificationEnabled !== undefined) {
      doc.auth.otpVerificationEnabled = data.otpVerificationEnabled;
    }
    if (data.googleLoginEnabled !== undefined) {
      doc.auth.googleLoginEnabled = data.googleLoginEnabled;
    }
    doc.updatedBy = new Types.ObjectId(updatedBy) as unknown as typeof doc.updatedBy;
    await doc.save();
    return doc.auth;
  }
}
