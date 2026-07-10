import { Types, FilterQuery } from 'mongoose';
import { Notification, INotification } from '../database/models/notification.model';
import { User } from '../database/models/user.model';
import { Business } from '../database/models/business.model';
import { NotFoundError, ForbiddenError } from '../common/errors/AppError';
import { OneSignalService } from './onesignal.service';
import { Request } from 'express';

export interface NotifyPayload {
  userId: string;
  businessId?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  static async notify(payload: NotifyPayload): Promise<INotification> {
    const notification = await Notification.create({
      userId: new Types.ObjectId(payload.userId),
      businessId: payload.businessId ? new Types.ObjectId(payload.businessId) : undefined,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      isRead: false,
    });

    await OneSignalService.sendPush({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: { ...payload.data, type: payload.type, notificationId: notification._id.toString() },
    });

    return notification;
  }

  static async notifyBusinessOwner(businessId: string, payload: Omit<NotifyPayload, 'userId' | 'businessId'>) {
    const business = await Business.findOne({ _id: businessId, isDeleted: false });
    if (!business) return null;
    return this.notify({
      userId: business.ownerId.toString(),
      businessId,
      ...payload,
    });
  }

  static async list(req: Request, page = 1, limit = 20) {
    const filter: FilterQuery<INotification> = { userId: req.user!.id };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);
    return { items, meta: { page, limit, total } };
  }

  static async listAdmin(req: Request, page = 1, limit = 20) {
    if (!req.user?.roles.includes('super_admin')) throw new ForbiddenError();

    const filter: FilterQuery<INotification> = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.businessId) filter.businessId = req.query.businessId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find(filter)
        .populate('userId', 'firstName lastName email roleSlugs')
        .populate('businessId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);
    return { items, meta: { page, limit, total } };
  }

  static async unreadCount(userId: string) {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { count };
  }

  static async markRead(id: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true },
    );
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
  }

  static async markAllRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  static async sendAdmin(
    req: Request,
    data: {
      title: string;
      body: string;
      type?: string;
      userId?: string;
      businessId?: string;
      roleSlug?: string;
    },
  ) {
    if (!req.user?.roles.includes('super_admin')) throw new ForbiddenError();

    const type = data.type || 'admin_message';
    const targets = new Set<string>();

    if (data.userId) targets.add(data.userId);

    if (data.businessId) {
      const business = await Business.findOne({ _id: data.businessId, isDeleted: false });
      if (business) targets.add(business.ownerId.toString());
    }

    if (data.roleSlug) {
      const users = await User.find({ roleSlugs: data.roleSlug, isDeleted: false, status: 'active' });
      users.forEach((user) => targets.add(user._id.toString()));
    }

    if (targets.size === 0) {
      throw new ForbiddenError('Specify at least one recipient: userId, businessId, or roleSlug');
    }

    const results = await Promise.all(
      Array.from(targets).map((userId) =>
        this.notify({
          userId,
          businessId: data.businessId,
          type,
          title: data.title,
          body: data.body,
        }),
      ),
    );

    return { sent: results.length, notifications: results };
  }
}
