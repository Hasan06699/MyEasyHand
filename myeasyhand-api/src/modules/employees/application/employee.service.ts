import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import {
  Employee,
  IEmployee,
  EmployeeType,
  EmployeeStatus,
} from '../../../database/models/employee.model';
import { EmployeeSkill, SkillProficiency } from '../../../database/models/employee-skill.model';
import { EmployeeAvailability } from '../../../database/models/employee-availability.model';
import { Booking } from '../../../database/models/booking.model';
import { BookingAssignment } from '../../../database/models/booking-assignment.model';
import { User } from '../../../database/models/user.model';
import { Service } from '../../../database/models/service.model';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../../common/errors/AppError';
import { TokenService } from '../../../services/otp.service';
import { AuditLogService } from '../../audit/application/audit-log.service';
import { SubscriptionAccessService } from '../../subscriptions/application/subscription-access.service';
import { EmployeeActivityService } from './employee-activity.service';
import { IPlan } from '../../../database/models/plan.model';

const EMPLOYEE_POPULATE = [
  { path: 'userId', select: 'firstName lastName email phone avatar status' },
  { path: 'businessId', select: 'name slug' },
];

export type CreateEmployeeInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeType: EmployeeType;
  designation: string;
  department?: string;
  hireDate?: string;
  notes?: string;
  businessId?: string;
};

export type UpdateEmployeeInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  employeeType?: EmployeeType;
  designation?: string;
  department?: string;
  hireDate?: string;
  status?: EmployeeStatus;
  notes?: string;
};

export type SkillInput = {
  skillName: string;
  serviceId?: string;
  proficiencyLevel?: SkillProficiency;
};

export type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

export class EmployeeService {
  private static resolveBusinessId(req: Request, override?: string): string {
    if (req.user?.roles.includes('super_admin') && override) return override;
    if (req.user?.businessId) return req.user.businessId;
    throw new ForbiddenError('Business context required');
  }

  private static async assertEmployeeLimit(businessId: string): Promise<void> {
    const subscription = await SubscriptionAccessService.getLatestForBusiness(businessId);
    if (!subscription || !SubscriptionAccessService.isValid(subscription)) {
      throw new ForbiddenError('Active subscription required to add employees');
    }

    const plan = subscription.planId as unknown as IPlan;
    const maxEmployees = plan?.limits?.maxEmployees ?? 1;

    const activeCount = await Employee.countDocuments({
      businessId,
      isDeleted: false,
      status: { $ne: 'terminated' },
    });

    if (activeCount >= maxEmployees) {
      throw new ValidationError(
        `Employee limit reached (${maxEmployees}). Upgrade your plan to add more employees.`,
      );
    }
  }

  private static async generateEmployeeCode(businessId: string): Promise<string> {
    const count = await Employee.countDocuments({ businessId });
    const suffix = String(count + 1).padStart(4, '0');
    return `EMP-${businessId.slice(-4).toUpperCase()}-${suffix}`;
  }

  static getBusinessFilter(req: Request): FilterQuery<IEmployee> {
    const filter: FilterQuery<IEmployee> = { isDeleted: false };

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    } else if (req.query.businessId) {
      filter.businessId = req.query.businessId as string;
    }

    if (req.query.status) filter.status = req.query.status as EmployeeStatus;
    if (req.query.employeeType) filter.employeeType = req.query.employeeType as EmployeeType;
    if (req.query.search) {
      // Search handled in list via user lookup
    }

    return filter;
  }

  private static async findEmployeeOrFail(id: string, req: Request): Promise<IEmployee> {
    const filter: FilterQuery<IEmployee> = { _id: id, isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    const employee = await Employee.findOne(filter);
    if (!employee) throw new NotFoundError('Employee not found');

    if (
      req.user?.roles.includes('employee') &&
      !req.user.roles.includes('business_owner') &&
      !req.user.roles.includes('super_admin') &&
      employee.userId.toString() !== req.user.id
    ) {
      throw new ForbiddenError();
    }

    return employee;
  }

  static async list(req: Request, page = 1, limit = 20) {
    const filter = this.getBusinessFilter(req);

    if (req.query.search) {
      const search = String(req.query.search);
      const matchingUsers = await User.find({
        isDeleted: false,
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') },
        ],
      }).select('_id');
      filter.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Employee.find(filter)
        .populate(EMPLOYEE_POPULATE)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Employee.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }

  static async getById(req: Request, id: string) {
    const employee = await this.findEmployeeOrFail(id, req);
    await employee.populate(EMPLOYEE_POPULATE);

    const [skills, availability] = await Promise.all([
      EmployeeSkill.find({ employeeId: employee._id, isDeleted: false })
        .populate('serviceId', 'name slug')
        .sort({ skillName: 1 }),
      EmployeeAvailability.find({ employeeId: employee._id, isDeleted: false }).sort({ dayOfWeek: 1 }),
    ]);

    return { ...employee.toObject(), skills, availability };
  }

  static async create(req: Request, data: CreateEmployeeInput) {
    const businessId = this.resolveBusinessId(req, data.businessId);
    await this.assertEmployeeLimit(businessId);

    const existingUser = await User.findOne({ email: data.email.toLowerCase(), isDeleted: false });
    if (existingUser) throw new ConflictError('Email already registered');

    const passwordHash = await TokenService.hashPassword(data.password);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleSlugs: ['employee'],
      businessId: new Types.ObjectId(businessId),
      isEmailVerified: true,
      status: 'active',
    });

    const employeeCode = await this.generateEmployeeCode(businessId);
    const employee = await Employee.create({
      userId: user._id,
      businessId: new Types.ObjectId(businessId),
      employeeCode,
      employeeType: data.employeeType,
      designation: data.designation,
      department: data.department,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      notes: data.notes,
      status: 'active',
    });

    await EmployeeActivityService.log({
      req,
      employeeId: employee._id,
      businessId,
      userId: user._id,
      type: 'employee_created',
      title: 'Employee profile created',
      description: `${data.firstName} ${data.lastName} joined as ${data.designation}`,
      metadata: { employeeType: data.employeeType, employeeCode },
    });

    await AuditLogService.log({
      req,
      businessId,
      module: 'employees',
      action: 'create',
      resourceId: employee._id.toString(),
      metadata: { employeeCode, employeeType: data.employeeType },
    });

    await employee.populate(EMPLOYEE_POPULATE);
    return employee;
  }

  static async update(req: Request, id: string, data: UpdateEmployeeInput) {
    const employee = await this.findEmployeeOrFail(id, req);
    const user = await User.findOne({ _id: employee.userId, isDeleted: false });
    if (!user) throw new NotFoundError('User not found');

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.password) {
      user.passwordHash = await TokenService.hashPassword(data.password);
    }
    await user.save();

    if (data.employeeType) employee.employeeType = data.employeeType;
    if (data.designation) employee.designation = data.designation;
    if (data.department !== undefined) employee.department = data.department || undefined;
    if (data.hireDate !== undefined) {
      employee.hireDate = data.hireDate ? new Date(data.hireDate) : undefined;
    }
    if (data.status) {
      employee.status = data.status;
      if (data.status === 'terminated') user.status = 'inactive';
      else if (data.status === 'active') user.status = 'active';
    }
    if (data.notes !== undefined) employee.notes = data.notes || undefined;

    await employee.save();

    await EmployeeActivityService.log({
      req,
      employeeId: employee._id,
      businessId: employee.businessId,
      userId: employee.userId,
      type: data.password ? 'password_reset' : 'profile_updated',
      title: data.password ? 'Password reset' : 'Profile updated',
      description: data.password
        ? 'Login password was reset by an administrator'
        : 'Employee profile was updated',
      metadata: {
        fields: Object.keys(data).filter((k) => k !== 'password'),
        passwordChanged: Boolean(data.password),
      },
    });

    await AuditLogService.log({
      req,
      businessId: employee.businessId.toString(),
      module: 'employees',
      action: 'update',
      resourceId: employee._id.toString(),
    });

    await employee.populate(EMPLOYEE_POPULATE);
    return employee;
  }

  static async delete(req: Request, id: string) {
    const employee = await this.findEmployeeOrFail(id, req);

    employee.isDeleted = true;
    employee.status = 'terminated';
    await employee.save();

    await User.findByIdAndUpdate(employee.userId, { status: 'inactive', isDeleted: true });

    await AuditLogService.log({
      req,
      businessId: employee.businessId.toString(),
      module: 'employees',
      action: 'delete',
      resourceId: employee._id.toString(),
    });

    return { message: 'Employee removed' };
  }

  static async updateSkills(req: Request, id: string, skills: SkillInput[]) {
    const employee = await this.findEmployeeOrFail(id, req);

    for (const skill of skills) {
      if (skill.serviceId) {
        const service = await Service.findOne({
          _id: skill.serviceId,
          businessId: employee.businessId,
          isDeleted: false,
        });
        if (!service) throw new NotFoundError(`Service not found: ${skill.serviceId}`);
      }
    }

    await EmployeeSkill.updateMany(
      { employeeId: employee._id, isDeleted: false },
      { isDeleted: true },
    );

    if (skills.length > 0) {
      await EmployeeSkill.insertMany(
        skills.map((s) => ({
          employeeId: employee._id,
          businessId: employee.businessId,
          serviceId: s.serviceId ? new Types.ObjectId(s.serviceId) : undefined,
          skillName: s.skillName,
          proficiencyLevel: s.proficiencyLevel ?? 'intermediate',
        })),
      );
    }

    await EmployeeActivityService.log({
      req,
      employeeId: employee._id,
      businessId: employee.businessId,
      userId: employee.userId,
      type: 'skills_updated',
      title: 'Skills updated',
      description: `${skills.length} skill(s) configured`,
      metadata: { skillCount: skills.length },
    });

    const updated = await EmployeeSkill.find({ employeeId: employee._id, isDeleted: false })
      .populate('serviceId', 'name slug')
      .sort({ skillName: 1 });

    return updated;
  }

  static async updateAvailability(req: Request, id: string, slots: AvailabilityInput[]) {
    const employee = await this.findEmployeeOrFail(id, req);

    for (const slot of slots) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new ValidationError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
      }
      if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
        throw new ValidationError('Times must be in HH:MM format');
      }
    }

    await EmployeeAvailability.updateMany(
      { employeeId: employee._id, isDeleted: false },
      { isDeleted: true },
    );

    if (slots.length > 0) {
      await EmployeeAvailability.insertMany(
        slots.map((s) => ({
          employeeId: employee._id,
          businessId: employee.businessId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable ?? true,
        })),
      );
    }

    await EmployeeActivityService.log({
      req,
      employeeId: employee._id,
      businessId: employee.businessId,
      userId: employee.userId,
      type: 'availability_updated',
      title: 'Availability updated',
      description: `${slots.length} slot(s) configured`,
      metadata: { slotCount: slots.length },
    });

    return EmployeeAvailability.find({ employeeId: employee._id, isDeleted: false }).sort({
      dayOfWeek: 1,
    });
  }

  static async getPerformance(req: Request, id: string) {
    const employee = await this.findEmployeeOrFail(id, req);

    const bookingFilter = {
      employeeId: employee.userId,
      businessId: employee.businessId,
      isDeleted: false,
    };

    const [
      totalAssigned,
      completed,
      inProgress,
      cancelled,
      revenueResult,
      recentAssignments,
      avgCompletionDays,
    ] = await Promise.all([
      Booking.countDocuments(bookingFilter),
      Booking.countDocuments({ ...bookingFilter, status: 'completed' }),
      Booking.countDocuments({
        ...bookingFilter,
        status: { $in: ['in_progress', 'service_in_progress', 'visit_started', 'visit_scheduled'] },
      }),
      Booking.countDocuments({ ...bookingFilter, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { ...bookingFilter, status: { $in: ['completed', 'paid', 'closed'] }, paymentStatus: { $in: ['paid', 'partial_paid'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      BookingAssignment.find({ employeeId: employee._id, isDeleted: false })
        .populate('bookingId', 'bookingNumber status scheduledAt totalAmount')
        .sort({ createdAt: -1 })
        .limit(10),
      Booking.aggregate([
        { $match: { ...bookingFilter, status: 'completed' } },
        {
          $project: {
            days: {
              $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$days' } } },
      ]),
    ]);

    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    return {
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      employeeType: employee.employeeType,
      totalAssigned,
      completed,
      inProgress,
      cancelled,
      completionRate,
      revenueGenerated: revenueResult[0]?.total ?? 0,
      avgCompletionDays: avgCompletionDays[0]?.avg
        ? Math.round(avgCompletionDays[0].avg * 10) / 10
        : 0,
      recentAssignments,
    };
  }

  static async getActivities(req: Request, id: string, page = 1, limit = 20) {
    await this.findEmployeeOrFail(id, req);
    return EmployeeActivityService.list(id, page, limit);
  }

  static async getStats(req: Request) {
    const filter: FilterQuery<IEmployee> = { isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    } else if (req.query.businessId) {
      filter.businessId = req.query.businessId as string;
    }

    const [total, active, onLeave, officeStaff, serviceStaff] = await Promise.all([
      Employee.countDocuments(filter),
      Employee.countDocuments({ ...filter, status: 'active' }),
      Employee.countDocuments({ ...filter, status: 'on_leave' }),
      Employee.countDocuments({ ...filter, employeeType: 'office_staff' }),
      Employee.countDocuments({ ...filter, employeeType: 'service_staff' }),
    ]);

    return { total, active, onLeave, officeStaff, serviceStaff };
  }

  static async listServiceStaff(req: Request, businessId?: string) {
    const filter: FilterQuery<IEmployee> = {
      isDeleted: false,
      status: 'active',
      employeeType: 'service_staff',
    };

    if (businessId) {
      filter.businessId = businessId;
    } else if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    return Employee.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
  }

  static async findByUserId(userId: string): Promise<IEmployee | null> {
    return Employee.findOne({ userId, isDeleted: false, status: { $ne: 'terminated' } });
  }

  static async getMe(req: Request) {
    if (!req.user?.roles.includes('employee')) {
      throw new ForbiddenError('Employee access required');
    }

    const employee = await Employee.findOne({ userId: req.user.id, isDeleted: false });
    if (!employee) throw new NotFoundError('Employee profile not found');

    return this.getById(req, employee._id.toString());
  }
}
