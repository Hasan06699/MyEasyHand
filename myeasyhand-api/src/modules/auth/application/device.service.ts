import { Types } from 'mongoose';
import { UserDevice, DevicePlatform, IUserDevice } from '../../../database/models/user-device.model';

export interface RegisterDeviceInput {
  userId: string;
  platform: DevicePlatform;
  onesignalSubscriptionId?: string;
  deviceLabel?: string;
  userAgent?: string;
}

export class DeviceService {
  /** Register or refresh a device — one user can have many active devices (web + app). */
  static async registerDevice(input: RegisterDeviceInput): Promise<IUserDevice> {
    const filter = input.onesignalSubscriptionId
      ? { userId: new Types.ObjectId(input.userId), onesignalSubscriptionId: input.onesignalSubscriptionId }
      : {
          userId: new Types.ObjectId(input.userId),
          platform: input.platform,
          userAgent: input.userAgent || '',
          onesignalSubscriptionId: { $exists: false },
        };

    return UserDevice.findOneAndUpdate(
      filter,
      {
        userId: new Types.ObjectId(input.userId),
        platform: input.platform,
        onesignalSubscriptionId: input.onesignalSubscriptionId,
        deviceLabel: input.deviceLabel,
        userAgent: input.userAgent,
        isActive: true,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  static async unregisterDevice(userId: string, onesignalSubscriptionId?: string): Promise<void> {
    if (!onesignalSubscriptionId) return;

    await UserDevice.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), onesignalSubscriptionId },
      { isActive: false, lastSeenAt: new Date() },
    );
  }

  static async listActiveDevices(userId: string): Promise<IUserDevice[]> {
    return UserDevice.find({ userId: new Types.ObjectId(userId), isActive: true }).sort({
      lastSeenAt: -1,
    });
  }

  static async getActiveSubscriptionIds(userId: string): Promise<string[]> {
    const devices = await UserDevice.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
      onesignalSubscriptionId: { $exists: true, $ne: '' },
    }).select('onesignalSubscriptionId');

    return devices
      .map((d) => d.onesignalSubscriptionId)
      .filter((id): id is string => Boolean(id));
  }
}
