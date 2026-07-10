import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import { User, IUser } from '../../../database/models/user.model';
import { Booking } from '../../../database/models/booking.model';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../../common/errors/AppError';
import { TokenService } from '../../../services/otp.service';
import { PasswordVaultService } from '../../../services/password-vault.service';
import { AuditLogService } from '../../audit/application/audit-log.service';

export type CreateCustomerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type UpdateCustomerInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: IUser['status'];
  password?: string;
};

export class CustomerService {
  private static async verifyAdminPassword(req: Request, adminPassword: string): Promise<void> {
    if (!req.user?.id) throw new UnauthorizedError();

    const admin = await User.findById(req.user.id).select('+passwordHash');
    if (!admin?.passwordHash) {
      throw new ValidationError('Your account does not have a password set for verification');
    }

    const valid = await TokenService.comparePassword(adminPassword, admin.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid admin password');
  }

  private static async applyCustomerPassword(customer: IUser, password: string): Promise<void> {
    customer.passwordHash = await TokenService.hashPassword(password);
    customer.recoverablePassword = PasswordVaultService.encrypt(password);
  }
  private static isAdmin(req: Request): boolean {
    const roles = req.user?.roles ?? [];
    return roles.includes('super_admin') || roles.includes('business_owner');
  }

  private static async getScopedCustomerIds(req: Request): Promise<Types.ObjectId[] | null> {
    if (req.user?.roles.includes('super_admin')) return null;

    if (req.user?.roles.includes('business_owner') && req.user.businessId) {
      const ids = await Booking.distinct('customerId', {
        businessId: new Types.ObjectId(req.user.businessId),
        isDeleted: false,
      });
      return ids as Types.ObjectId[];
    }

    throw new ForbiddenError();
  }

  private static getCustomerFilter(req: Request): FilterQuery<IUser> {
    const filter: FilterQuery<IUser> = {
      isDeleted: false,
      roleSlugs: 'customer',
    };

    if (req.query.status) {
      filter.status = req.query.status as IUser['status'];
    }

    return filter;
  }

  private static async findCustomerOrFail(id: string, req: Request): Promise<IUser> {
    const filter: FilterQuery<IUser> = {
      _id: id,
      isDeleted: false,
      roleSlugs: 'customer',
    };

    const customer = await User.findOne(filter);
    if (!customer) throw new NotFoundError('Customer not found');

    const scopedIds = await this.getScopedCustomerIds(req);
    if (scopedIds && !scopedIds.some((cid) => cid.toString() === customer._id.toString())) {
      throw new ForbiddenError();
    }

    return customer;
  }

  static async list(req: Request, page = 1, limit = 20) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    const filter = this.getCustomerFilter(req);
    const scopedIds = await this.getScopedCustomerIds(req);

    if (scopedIds) {
      filter._id = { $in: scopedIds };
    }

    if (req.query.search) {
      const search = String(req.query.search);
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email phone avatar status isEmailVerified lastLoginAt createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    const customerIds = items.map((c) => c._id);
    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          customerId: { $in: customerIds },
          isDeleted: false,
          ...(req.user?.businessId && !req.user.roles.includes('super_admin')
            ? { businessId: new Types.ObjectId(req.user.businessId) }
            : {}),
        },
      },
      { $group: { _id: '$customerId', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
    ]);

    const statsMap = new Map(
      bookingCounts.map((b) => [b._id.toString(), { bookings: b.count, totalSpent: b.totalSpent }]),
    );

    const enriched = items.map((customer) => {
      const stats = statsMap.get(customer._id.toString());
      return {
        ...customer.toObject(),
        bookingCount: stats?.bookings ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
      };
    });

    return { items: enriched, meta: { page, limit, total } };
  }

  static async getById(req: Request, id: string) {
    const customer = await this.findCustomerOrFail(id, req);
    const credentials = await User.findById(customer._id).select('+passwordHash +recoverablePassword');

    const bookingFilter: Record<string, unknown> = {
      customerId: customer._id,
      isDeleted: false,
    };

    if (req.user?.businessId && !req.user.roles.includes('super_admin')) {
      bookingFilter.businessId = new Types.ObjectId(req.user.businessId);
    }

    const [bookings, bookingStats] = await Promise.all([
      Booking.find(bookingFilter)
        .populate('serviceId', 'name slug')
        .populate('businessId', 'name slug')
        .sort({ scheduledAt: -1 })
        .limit(20),
      Booking.aggregate([
        { $match: bookingFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            totalSpent: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const stats = bookingStats[0] ?? { total: 0, completed: 0, cancelled: 0, totalSpent: 0 };

    return {
      ...customer.toObject(),
      hasPassword: Boolean(credentials?.passwordHash),
      canViewPassword: Boolean(credentials?.recoverablePassword),
      bookings,
      stats: {
        totalBookings: stats.total,
        completedBookings: stats.completed,
        cancelledBookings: stats.cancelled,
        totalSpent: stats.totalSpent,
      },
    };
  }

  static async create(req: Request, data: CreateCustomerInput) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    const existingUser = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false });
    if (existingUser) throw new ConflictError('Email already registered');

    const passwordHash = await TokenService.hashPassword(data.password);
    const customer = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      recoverablePassword: PasswordVaultService.encrypt(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleSlugs: ['customer'],
      isEmailVerified: true,
      status: 'active',
    });

    await AuditLogService.log({
      req,
      module: 'customers',
      action: 'create',
      resourceId: customer._id.toString(),
      metadata: { email: customer.email },
    });

    return customer;
  }

  static async update(req: Request, id: string, data: UpdateCustomerInput) {
    const customer = await this.findCustomerOrFail(id, req);

    if (data.firstName) customer.firstName = data.firstName;
    if (data.lastName) customer.lastName = data.lastName;
    if (data.phone !== undefined) customer.phone = data.phone || undefined;
    if (data.status) customer.status = data.status;
    if (data.password) {
      await this.applyCustomerPassword(customer, data.password);
    }

    await customer.save();

    await AuditLogService.log({
      req,
      module: 'customers',
      action: 'update',
      resourceId: customer._id.toString(),
      metadata: {
        fields: Object.keys(data).filter((key) => key !== 'password'),
        passwordChanged: Boolean(data.password),
      },
    });

    return customer;
  }

  static async viewPassword(req: Request, id: string, adminPassword: string) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    await this.verifyAdminPassword(req, adminPassword);
    const customer = await this.findCustomerOrFail(id, req);
    const credentials = await User.findById(customer._id).select('+passwordHash +recoverablePassword');

    if (!credentials?.passwordHash) {
      throw new ValidationError('This customer does not have a password login');
    }
    if (!credentials.recoverablePassword) {
      throw new ValidationError(
        'Password cannot be viewed for this customer. Set a new password to enable viewing.',
      );
    }

    const password = PasswordVaultService.decrypt(credentials.recoverablePassword);

    await AuditLogService.log({
      req,
      module: 'customers',
      action: 'view_password',
      resourceId: customer._id.toString(),
    });

    return { password };
  }

  static async delete(req: Request, id: string) {
    const customer = await this.findCustomerOrFail(id, req);

    customer.isDeleted = true;
    customer.status = 'inactive';
    await customer.save();

    await AuditLogService.log({
      req,
      module: 'customers',
      action: 'delete',
      resourceId: customer._id.toString(),
    });

    return { message: 'Customer removed' };
  }

  static async getStats(req: Request) {
    if (!this.isAdmin(req)) throw new ForbiddenError();

    const filter = this.getCustomerFilter(req);
    const scopedIds = await this.getScopedCustomerIds(req);

    if (scopedIds) {
      filter._id = { $in: scopedIds };
    }

    const [total, active, inactive, suspended] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({ ...filter, status: 'active' }),
      User.countDocuments({ ...filter, status: 'inactive' }),
      User.countDocuments({ ...filter, status: 'suspended' }),
    ]);

    return { total, active, inactive, suspended };
  }
}
