import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import { Booking, IBooking } from '../../../database/models/booking.model';
import { BookingAssignment } from '../../../database/models/booking-assignment.model';
import { BookingLineItem } from '../../../database/models/booking-line-item.model';
import { BookingStatusHistory } from '../../../database/models/booking-status-history.model';
import { BookingMaterial } from '../../../database/models/booking-material.model';
import { Payment } from '../../../database/models/payment.model';
import { Review } from '../../../database/models/review.model';
import { Service } from '../../../database/models/service.model';
import { Employee } from '../../../database/models/employee.model';
import { Business } from '../../../database/models/business.model';
import { NotificationService } from '../../../services/notification.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../common/errors/AppError';
import { EmployeeActivityService } from '../../employees/application/employee-activity.service';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../booking.constants';
import { CouponService } from '../../coupons/application/coupon.service';
import {
  generateBookingNumber,
  generateOrderGroupId,
  generateOtp,
  generateQrToken,
  getEffectiveServicePrice,
  calculateTotals,
  normalizeLegacyStatus,
  getRefId,
} from './booking.helpers';

type CheckoutItem = { serviceId: string; quantity: number; notes?: string };

export class BookingService {
  private static assertBusinessAccess(req: Request, businessId: Types.ObjectId | string | { _id?: Types.ObjectId | string }) {
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId !== getRefId(businessId)) {
      throw new ForbiddenError();
    }
  }

  private static async logStatusChange(
    booking: IBooking,
    fromStatus: BookingStatus | undefined,
    toStatus: BookingStatus,
    changedBy: string,
    notes?: string,
  ) {
    await BookingStatusHistory.create({
      bookingId: booking._id,
      businessId: booking.businessId,
      fromStatus,
      toStatus,
      changedBy: new Types.ObjectId(changedBy),
      notes,
    });
  }

  private static async transitionStatus(
    booking: IBooking,
    toStatus: BookingStatus,
    changedBy: string,
    notes?: string,
  ) {
    const fromStatus = normalizeLegacyStatus(booking.status);
    booking.status = toStatus;
    await booking.save();
    await this.logStatusChange(booking, fromStatus, toStatus, changedBy, notes);
    return booking;
  }

  private static async recalculateBookingTotals(bookingId: Types.ObjectId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    const lineItems = await BookingLineItem.find({
      bookingId,
      isDeleted: false,
      action: { $ne: 'removed' },
    });
    const materials = await BookingMaterial.find({ bookingId, isDeleted: false });

    const lineSubtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const materialSubtotal = materials.reduce((sum, m) => sum + m.totalPrice, 0);
    const subtotal = lineSubtotal + materialSubtotal;

    const totals = calculateTotals(subtotal, booking.discountAmount);
    booking.subtotal = totals.subtotal;
    booking.taxAmount = totals.taxAmount;
    booking.totalAmount = totals.totalAmount;
    await booking.save();
  }

  private static bookingPopulate = [
    { path: 'serviceId', select: 'name basePrice duration priceType shortDescription' },
    { path: 'customerId', select: 'firstName lastName email phone' },
    { path: 'employeeId', select: 'firstName lastName email phone' },
    { path: 'teamLeaderId', select: 'firstName lastName email phone' },
    { path: 'businessId', select: 'name slug phone email' },
  ];

  static async list(req: Request, page = 1, limit = 20, status?: string) {
    const filter: FilterQuery<IBooking> = { isDeleted: false };

    if (req.user?.roles.includes('customer')) {
      filter.customerId = req.user.id;
    } else if (req.user?.roles.includes('employee')) {
      const assignments = await BookingAssignment.find({
        userId: req.user.id,
        status: 'active',
        isDeleted: false,
      }).select('bookingId');
      filter._id = { $in: assignments.map((a) => a.bookingId) };
    } else if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate(this.bookingPopulate)
        .skip(skip)
        .limit(limit)
        .sort({ scheduledAt: -1 }),
      Booking.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }

  static async getById(req: Request, id: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false }).populate(this.bookingPopulate);
    if (!booking) throw new NotFoundError('Booking not found');

    const isSuperAdmin = req.user?.roles.includes('super_admin');
    const isCustomer = req.user?.roles.includes('customer');
    const isEmployee = req.user?.roles.includes('employee');
    const isBookingCustomer = isCustomer && getRefId(booking.customerId) === req.user!.id;

    if (isCustomer && !isBookingCustomer) {
      throw new ForbiddenError();
    }

    if (isEmployee) {
      const assigned = await BookingAssignment.findOne({
        bookingId: booking._id,
        userId: req.user!.id,
        isDeleted: false,
      });
      if (!assigned) throw new ForbiddenError();
    } else if (!isSuperAdmin && !isBookingCustomer && req.user?.businessId) {
      this.assertBusinessAccess(req, booking.businessId);
    }

    const [lineItems, assignments, materials, payments, statusHistory] = await Promise.all([
      BookingLineItem.find({ bookingId: booking._id, isDeleted: false }).populate('serviceId', 'name slug'),
      BookingAssignment.find({ bookingId: booking._id, isDeleted: false })
        .populate('employeeId', 'employeeCode designation')
        .populate('userId', 'firstName lastName email phone'),
      BookingMaterial.find({ bookingId: booking._id, isDeleted: false }),
      Payment.find({ bookingId: booking._id, isDeleted: false }).sort({ createdAt: -1 }),
      BookingStatusHistory.find({ bookingId: booking._id }).sort({ createdAt: -1 }).limit(50),
    ]);

    return { booking, lineItems, assignments, materials, payments, statusHistory };
  }

  /** Legacy single-service create (backward compatible) */
  static async create(req: Request, data: {
    serviceId: string;
    businessId: string;
    scheduledAt: string;
    notes?: string;
  }) {
    const result = await this.checkout(req, {
      items: [{ serviceId: data.serviceId, quantity: 1, notes: data.notes }],
      scheduledAt: data.scheduledAt,
      notes: data.notes,
    });
    return result.bookings[0];
  }

  /** Multi-service, multi-owner checkout */
  static async checkout(req: Request, data: {
    items: CheckoutItem[];
    scheduledAt: string;
    notes?: string;
    couponCode?: string;
    autoApplyBestCoupon?: boolean;
    cityName?: string;
    areaName?: string;
  }) {
    if (!data.items?.length) throw new ValidationError('At least one service is required');

    const resolved = await Promise.all(
      data.items.map(async (item) => {
        const service = await Service.findOne({ _id: item.serviceId, isDeleted: false, status: 'active' });
        if (!service) throw new NotFoundError(`Service ${item.serviceId} not found`);
        const unitPrice = getEffectiveServicePrice(service);
        return { ...item, service, unitPrice, lineTotal: unitPrice * item.quantity };
      }),
    );

    const orderGroupId = generateOrderGroupId();
    const bookings: IBooking[] = [];
    const businessGroups = new Map<string, typeof resolved>();

    for (const item of resolved) {
      const key = item.service.businessId.toString();
      const group = businessGroups.get(key) ?? [];
      group.push(item);
      businessGroups.set(key, group);
    }

    for (const [businessId, groupItems] of businessGroups) {
      const subtotal = groupItems.reduce((sum, i) => sum + i.lineTotal, 0);
      const serviceIds = groupItems.map((i) => i.service._id.toString());
      const categoryIds = groupItems
        .map((i) => i.service.parentCategoryId?.toString())
        .filter((id): id is string => Boolean(id));
      const subcategoryIds = groupItems
        .map((i) => i.service.subCategoryId?.toString())
        .filter((id): id is string => Boolean(id));

      let discountAmount = 0;
      let discountType: 'fixed' | 'percentage' | undefined;
      let appliedCouponCode: string | undefined;
      let cashbackAmount: number | undefined;
      let couponId: string | undefined;

      if (data.autoApplyBestCoupon) {
        const best = await CouponService.findBestCoupon(
          req.user!.id,
          businessId,
          subtotal,
          serviceIds,
          categoryIds,
          subcategoryIds,
          data.cityName,
          data.areaName,
        );
        if (best) {
          discountAmount = best.discountAmount;
          discountType = best.discountType;
          appliedCouponCode = best.coupon.code;
          cashbackAmount = best.cashbackAmount;
          couponId = best.coupon._id.toString();
        }
      } else if (data.couponCode) {
        const result = await CouponService.validateCoupon({
          code: data.couponCode,
          customerId: req.user!.id,
          businessId,
          subtotal,
          serviceIds,
          categoryIds,
          subcategoryIds,
          cityName: data.cityName,
          areaName: data.areaName,
        });
        discountAmount = result.discountAmount;
        discountType = result.discountType;
        appliedCouponCode = result.coupon.code;
        cashbackAmount = result.cashbackAmount;
        couponId = result.coupon._id.toString();
      }

      const totals = calculateTotals(subtotal, discountAmount);

      const booking = await Booking.create({
        bookingNumber: generateBookingNumber(),
        orderGroupId,
        customerId: new Types.ObjectId(req.user!.id),
        businessId: new Types.ObjectId(businessId),
        serviceId: groupItems[0].service._id,
        scheduledAt: new Date(data.scheduledAt),
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        discountType,
        couponCode: appliedCouponCode,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        notes: data.notes,
        status: 'pending',
        paymentStatus: 'pending',
      });

      if (couponId) {
        await CouponService.recordUsage({
          couponId,
          customerId: req.user!.id,
          bookingId: booking._id.toString(),
          orderGroupId,
          businessId,
          discountApplied: discountAmount,
          cashbackAmount,
        });
      }

      await this.logStatusChange(booking, undefined, 'pending', req.user!.id, 'Booking created');

      for (const item of groupItems) {
        await BookingLineItem.create({
          bookingId: booking._id,
          serviceId: item.service._id,
          serviceName: item.service.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.lineTotal,
          notes: item.notes,
          action: 'original',
        });
      }

      await NotificationService.notify({
        userId: req.user!.id,
        businessId,
        type: 'booking_created',
        title: 'Booking Received',
        body: `Your booking ${booking.bookingNumber} has been placed.`,
        data: { bookingId: booking._id.toString(), orderGroupId },
      });

      await NotificationService.notifyBusinessOwner(businessId, {
        type: 'booking_created',
        title: 'New Booking Received',
        body: `New booking ${booking.bookingNumber} requires your attention.`,
        data: { bookingId: booking._id.toString() },
      });

      bookings.push(booking);
    }

    return { orderGroupId, bookings };
  }

  static async accept(req: Request, id: string, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertBusinessAccess(req, booking.businessId);

    if (!['pending', 'rescheduled'].includes(booking.status)) {
      throw new ValidationError('Only pending or rescheduled bookings can be accepted');
    }

    await this.transitionStatus(booking, 'accepted', req.user!.id, notes);

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_status',
      title: 'Booking Accepted',
      body: `Your booking ${booking.bookingNumber} has been accepted.`,
      data: { bookingId: booking._id.toString(), status: 'accepted' },
    });

    return booking;
  }

  static async reject(req: Request, id: string, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertBusinessAccess(req, booking.businessId);

    await this.transitionStatus(booking, 'rejected', req.user!.id, notes);

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_status',
      title: 'Booking Rejected',
      body: `Your booking ${booking.bookingNumber} was rejected.${notes ? ` Reason: ${notes}` : ''}`,
      data: { bookingId: booking._id.toString(), status: 'rejected' },
    });

    return booking;
  }

  static async updateStatus(req: Request, id: string, status: BookingStatus, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');

    if (req.user?.roles.includes('employee')) {
      const allowed = ['visit_started', 'service_in_progress', 'completed'];
      if (!allowed.includes(status)) throw new ForbiddenError();
      const assigned = await BookingAssignment.findOne({
        bookingId: booking._id,
        userId: req.user.id,
        status: 'active',
        isDeleted: false,
      });
      if (!assigned) throw new ForbiddenError();
    } else {
      this.assertBusinessAccess(req, booking.businessId);
    }

    await this.transitionStatus(booking, status, req.user!.id, notes);

    if (booking.employeeId) {
      const employee = await Employee.findOne({
        userId: booking.employeeId,
        businessId: booking.businessId,
        isDeleted: false,
      });
      if (employee) {
        const activityType =
          status === 'visit_started' || status === 'service_in_progress'
            ? 'job_started'
            : status === 'completed'
              ? 'job_completed'
              : 'status_changed';
        await EmployeeActivityService.log({
          req,
          employeeId: employee._id,
          businessId: booking.businessId,
          userId: employee.userId,
          type: activityType,
          title: `Booking ${status.replace(/_/g, ' ')}`,
          description: `Booking ${booking.bookingNumber} status changed to ${status}`,
          metadata: { bookingId: booking._id.toString(), status },
        });
      }
    }

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_status',
      title: 'Booking Updated',
      body: `Your booking ${booking.bookingNumber} is now ${status.replace(/_/g, ' ')}.`,
      data: { bookingId: booking._id.toString(), status },
    });

    return booking;
  }

  static async assign(req: Request, id: string, employeeIds: string[], teamLeaderId?: string, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertBusinessAccess(req, booking.businessId);

    if (!['accepted', 'employee_assigned', 'employee_accepted', 'pending', 'confirmed'].includes(booking.status)) {
      throw new ValidationError('Booking cannot be assigned in current status');
    }

    if (!employeeIds.length) throw new ValidationError('At least one employee is required');

    await BookingAssignment.updateMany(
      { bookingId: booking._id, status: 'active', isDeleted: false },
      { status: 'reassigned' },
    );

    let primaryUserId: Types.ObjectId | undefined;
    let leaderUserId: Types.ObjectId | undefined;

    for (const employeeId of employeeIds) {
      const employee = await Employee.findOne({
        _id: employeeId,
        businessId: booking.businessId,
        isDeleted: false,
        status: 'active',
      });
      if (!employee) throw new NotFoundError(`Employee ${employeeId} not found or inactive`);
      if (employee.employeeType !== 'service_staff') {
        throw new ValidationError('Only service staff can be assigned to jobs');
      }

      const isTeamLeader = teamLeaderId === employeeId;
      if (isTeamLeader) leaderUserId = employee.userId;
      if (!primaryUserId) primaryUserId = employee.userId;

      await BookingAssignment.create({
        bookingId: booking._id,
        employeeId: employee._id,
        userId: employee.userId,
        businessId: booking.businessId,
        assignedBy: new Types.ObjectId(req.user!.id),
        isTeamLeader,
        employeeResponse: 'pending',
        status: 'active',
        notes,
      });

      await EmployeeActivityService.log({
        req,
        employeeId: employee._id,
        businessId: booking.businessId,
        userId: employee.userId,
        type: 'job_assigned',
        title: 'Job assigned',
        description: `Assigned to booking ${booking.bookingNumber}`,
        metadata: { bookingId: booking._id.toString(), bookingNumber: booking.bookingNumber },
      });

      await NotificationService.notify({
        userId: employee.userId.toString(),
        businessId: booking.businessId.toString(),
        type: 'booking_assigned',
        title: 'New Job Assignment',
        body: `You have been assigned to booking ${booking.bookingNumber}.`,
        data: { bookingId: booking._id.toString() },
      });
    }

    booking.employeeId = primaryUserId;
    booking.teamLeaderId = leaderUserId ?? primaryUserId;
    await this.transitionStatus(booking, 'employee_assigned', req.user!.id, notes);

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_status',
      title: 'Technician Assigned',
      body: `Employees have been assigned to booking ${booking.bookingNumber}.`,
      data: { bookingId: booking._id.toString() },
    });

    await booking.populate(this.bookingPopulate);
    return booking;
  }

  static async respondToAssignment(
    req: Request,
    bookingId: string,
    assignmentId: string,
    response: 'accepted' | 'rejected',
    notes?: string,
  ) {
    const assignment = await BookingAssignment.findOne({
      _id: assignmentId,
      bookingId,
      userId: req.user!.id,
      status: 'active',
      isDeleted: false,
    });
    if (!assignment) throw new NotFoundError('Assignment not found');

    assignment.employeeResponse = response;
    assignment.respondedAt = new Date();
    if (response === 'rejected') assignment.status = 'cancelled';
    await assignment.save();

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');

    if (response === 'accepted') {
      const allAssignments = await BookingAssignment.find({
        bookingId: booking._id,
        status: 'active',
        isDeleted: false,
      });
      const allAccepted = allAssignments.every((a) => a.employeeResponse === 'accepted');
      if (allAccepted) {
        await this.transitionStatus(booking, 'employee_accepted', req.user!.id);
      }

      const business = await Business.findById(booking.businessId);
      if (business) {
        await NotificationService.notify({
          userId: business.ownerId.toString(),
          businessId: booking.businessId.toString(),
          type: 'booking_status',
          title: 'Employee Accepted Job',
          body: `An employee accepted booking ${booking.bookingNumber}.`,
          data: { bookingId: booking._id.toString() },
        });
      }
    }

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_status',
      title: response === 'accepted' ? 'Technician Confirmed' : 'Technician Declined',
      body: `Assignment update for booking ${booking.bookingNumber}.`,
      data: { bookingId: booking._id.toString(), response },
    });

    return { assignment, booking };
  }

  static async scheduleVisit(req: Request, id: string, visitScheduledAt: string, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');

    const isEmployee = req.user?.roles.includes('employee');
    if (isEmployee) {
      const assigned = await BookingAssignment.findOne({
        bookingId: booking._id,
        userId: req.user!.id,
        status: 'active',
        isDeleted: false,
      });
      if (!assigned) throw new ForbiddenError();
    } else {
      this.assertBusinessAccess(req, booking.businessId);
    }

    booking.visitScheduledAt = new Date(visitScheduledAt);
    await this.transitionStatus(booking, 'visit_scheduled', req.user!.id, notes);

    const otp = generateOtp();
    const qrToken = generateQrToken();
    booking.visitVerification = {
      otp,
      otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      qrToken,
    };
    await booking.save();

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'visit_scheduled',
      title: 'Visit Scheduled',
      body: `Your visit for ${booking.bookingNumber} is scheduled at ${new Date(visitScheduledAt).toLocaleString()}.`,
      data: { bookingId: booking._id.toString(), visitScheduledAt, otp },
    });

    return booking;
  }

  static async verifyVisit(req: Request, id: string, data: { otp?: string; qrToken?: string }) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');

    const assigned = await BookingAssignment.findOne({
      bookingId: booking._id,
      userId: req.user!.id,
      status: 'active',
      isDeleted: false,
    });
    if (!assigned) throw new ForbiddenError();

    const verification = booking.visitVerification;
    if (!verification) throw new ValidationError('Visit verification not set up');

    const otpValid =
      data.otp &&
      verification.otp === data.otp &&
      verification.otpExpiresAt &&
      verification.otpExpiresAt > new Date();
    const qrValid = data.qrToken && verification.qrToken === data.qrToken;

    if (!otpValid && !qrValid) throw new ValidationError('Invalid or expired verification code');

    booking.visitVerification = {
      ...verification,
      verifiedAt: new Date(),
      verifiedBy: new Types.ObjectId(req.user!.id),
    };
    await this.transitionStatus(booking, 'visit_started', req.user!.id);

    return booking;
  }

  static async checkIn(
    req: Request,
    id: string,
    data: { latitude?: number; longitude?: number; photos?: string[]; notes?: string },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');

    const assigned = await BookingAssignment.findOne({
      bookingId: booking._id,
      userId: req.user!.id,
      status: 'active',
      isDeleted: false,
    });
    if (!assigned) throw new ForbiddenError();

    booking.checkIn = { ...data, at: new Date() };
    if (booking.status === 'visit_started') {
      await this.transitionStatus(booking, 'service_in_progress', req.user!.id);
    } else {
      await booking.save();
    }

    return booking;
  }

  static async updateServices(
    req: Request,
    id: string,
    changes: {
      add?: Array<{ serviceId: string; quantity: number; notes?: string }>;
      remove?: string[];
      updateQuantity?: Array<{ lineItemId: string; quantity: number }>;
    },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    if (changes.add) {
      for (const item of changes.add) {
        const service = await Service.findOne({ _id: item.serviceId, isDeleted: false, status: 'active' });
        if (!service) throw new NotFoundError(`Service ${item.serviceId} not found`);
        const unitPrice = getEffectiveServicePrice(service);
        await BookingLineItem.create({
          bookingId: booking._id,
          serviceId: service._id,
          serviceName: service.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
          notes: item.notes,
          action: 'added',
        });
      }
    }

    if (changes.remove) {
      for (const lineItemId of changes.remove) {
        const line = await BookingLineItem.findOne({ _id: lineItemId, bookingId: booking._id });
        if (line) {
          line.action = 'removed';
          line.isDeleted = true;
          await line.save();
        }
      }
    }

    if (changes.updateQuantity) {
      for (const update of changes.updateQuantity) {
        const line = await BookingLineItem.findOne({ _id: update.lineItemId, bookingId: booking._id, isDeleted: false });
        if (line) {
          line.quantity = update.quantity;
          line.totalPrice = line.unitPrice * update.quantity;
          line.action = 'quantity_changed';
          await line.save();
        }
      }
    }

    await this.recalculateBookingTotals(booking._id);
    const updated = await Booking.findById(booking._id);
    return updated;
  }

  static async addMaterial(
    req: Request,
    id: string,
    data: { name: string; type: 'spare_part' | 'consumable'; quantity: number; unitPrice: number; notes?: string },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    const material = await BookingMaterial.create({
      bookingId: booking._id,
      businessId: booking.businessId,
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice: data.unitPrice * data.quantity,
      addedBy: new Types.ObjectId(req.user!.id),
      notes: data.notes,
    });

    await this.recalculateBookingTotals(booking._id);
    return material;
  }

  static async applyDiscount(
    req: Request,
    id: string,
    data: { discountAmount: number; discountType: 'fixed' | 'percentage' },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    let discountAmount = data.discountAmount;
    if (data.discountType === 'percentage') {
      discountAmount = Math.round((booking.subtotal * data.discountAmount) / 100);
    }
    booking.discountAmount = discountAmount;
    booking.discountType = data.discountType;
    await this.recalculateBookingTotals(booking._id);
    return await Booking.findById(booking._id);
  }

  static async requestCustomerApproval(req: Request, id: string, notes?: string) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    booking.customerApproval = {
      status: 'pending',
      requestedAt: new Date(),
      draftAmount: booking.totalAmount,
      notes,
    };
    await this.transitionStatus(booking, 'awaiting_customer_approval', req.user!.id, notes);

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'approval_required',
      title: 'Approve Service Changes',
      body: `Booking ${booking.bookingNumber} has updated charges of ₹${booking.totalAmount}. Please review.`,
      data: { bookingId: booking._id.toString(), draftAmount: booking.totalAmount },
    });

    return booking;
  }

  static async customerApproval(
    req: Request,
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    notes?: string,
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    if (getRefId(booking.customerId) !== req.user!.id) throw new ForbiddenError();

    booking.customerApproval = {
      ...booking.customerApproval,
      status: decision,
      respondedAt: new Date(),
      notes,
    };

    if (decision === 'approved') {
      await this.transitionStatus(booking, 'approved', req.user!.id, notes);
    } else {
      await booking.save();
    }

    await NotificationService.notifyBusinessOwner(booking.businessId.toString(), {
      type: 'customer_approval',
      title: `Customer ${decision.replace(/_/g, ' ')}`,
      body: `Customer responded to booking ${booking.bookingNumber} changes.`,
      data: { bookingId: booking._id.toString(), decision },
    });

    return booking;
  }

  static async complete(
    req: Request,
    id: string,
    data: { completionPhotos?: string[]; completionNotes?: string; customerSignature?: string },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    booking.completionPhotos = data.completionPhotos;
    booking.completionNotes = data.completionNotes;
    booking.customerSignature = data.customerSignature;
    await this.transitionStatus(booking, 'completed', req.user!.id);

    await BookingAssignment.updateMany(
      { bookingId: booking._id, status: 'active', isDeleted: false },
      { status: 'completed' },
    );

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'booking_completed',
      title: 'Service Completed',
      body: `Booking ${booking.bookingNumber} has been marked complete.`,
      data: { bookingId: booking._id.toString() },
    });

    await CouponService.completeCashback(booking._id.toString());

    return booking;
  }

  static async checkOut(
    req: Request,
    id: string,
    data: { latitude?: number; longitude?: number; photos?: string[]; notes?: string },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    booking.checkOut = { ...data, at: new Date() };
    await booking.save();
    return booking;
  }

  static async recordPayment(
    req: Request,
    id: string,
    data: { amount: number; method: PaymentMethod; transactionRef?: string; notes?: string },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    this.assertEmployeeOrOwner(req, booking);

    const payment = await Payment.create({
      bookingId: booking._id,
      businessId: booking.businessId,
      customerId: booking.customerId,
      amount: data.amount,
      method: data.method,
      transactionRef: data.transactionRef,
      notes: data.notes,
      recordedBy: new Types.ObjectId(req.user!.id),
      status: 'paid',
    });

    booking.paidAmount = (booking.paidAmount || 0) + data.amount;
    if (booking.paidAmount >= booking.totalAmount) {
      booking.paymentStatus = 'paid';
      await this.transitionStatus(booking, 'paid', req.user!.id);
      await this.transitionStatus(booking, 'closed', req.user!.id);
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'partial_paid';
      await booking.save();
    }

    await NotificationService.notify({
      userId: booking.customerId.toString(),
      businessId: booking.businessId.toString(),
      type: 'payment_received',
      title: 'Payment Recorded',
      body: `₹${data.amount} received for booking ${booking.bookingNumber}.`,
      data: { bookingId: booking._id.toString(), paymentId: payment._id.toString() },
    });

    return { booking, payment };
  }

  static async submitReview(
    req: Request,
    id: string,
    data: {
      serviceRating: number;
      employeeRating?: number;
      ownerRating?: number;
      title?: string;
      comment?: string;
      serviceQuality?: number;
      behaviour?: number;
      punctuality?: number;
      pricingSatisfaction?: number;
    },
  ) {
    const booking = await Booking.findOne({ _id: id, isDeleted: false });
    if (!booking) throw new NotFoundError('Booking not found');
    if (getRefId(booking.customerId) !== req.user!.id) throw new ForbiddenError();

    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) throw new ValidationError('Review already submitted');

    const review = await Review.create({
      bookingId: booking._id,
      businessId: booking.businessId,
      customerId: booking.customerId,
      employeeId: booking.employeeId,
      ...data,
      status: 'pending',
    });

    return review;
  }

  static async moderateReview(req: Request, reviewId: string, status: 'approved' | 'rejected') {
    const review = await Review.findOne({ _id: reviewId, isDeleted: false });
    if (!review) throw new NotFoundError('Review not found');
    this.assertBusinessAccess(req, review.businessId);

    review.status = status;
    review.moderatedBy = new Types.ObjectId(req.user!.id);
    review.moderatedAt = new Date();
    await review.save();
    return review;
  }

  static async getStats(req: Request) {
    const filter: FilterQuery<IBooking> = { isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    const [total, pending, completed, revenue, awaitingApproval] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.countDocuments({ ...filter, status: { $in: ['pending', 'accepted', 'employee_assigned'] } }),
      Booking.countDocuments({ ...filter, status: { $in: ['completed', 'paid', 'closed'] } }),
      Booking.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ['paid', 'partial_paid'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Booking.countDocuments({ ...filter, status: 'awaiting_customer_approval' }),
    ]);

    return {
      totalBookings: total,
      pendingBookings: pending,
      completedBookings: completed,
      awaitingApproval,
      revenue: revenue[0]?.total || 0,
    };
  }

  private static assertEmployeeOrOwner(req: Request, booking: IBooking) {
    if (req.user?.roles.includes('employee')) {
      return;
    }
    this.assertBusinessAccess(req, booking.businessId);
  }
}
