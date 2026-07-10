import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BookingService } from '../application/booking.service';
import { sendCreated, sendPaginated, sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';
import { BOOKING_STATUSES, PAYMENT_METHODS } from '../booking.constants';

const checkoutSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        serviceId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
        notes: Joi.string().optional().allow(''),
      }),
    )
    .min(1)
    .required(),
  scheduledAt: Joi.date().iso().required(),
  notes: Joi.string().optional().allow(''),
  couponCode: Joi.string().optional().allow(''),
  autoApplyBestCoupon: Joi.boolean().optional(),
  cityName: Joi.string().optional(),
  areaName: Joi.string().optional(),
});

const createBookingSchema = Joi.object({
  serviceId: Joi.string().required(),
  businessId: Joi.string().required(),
  scheduledAt: Joi.date().iso().required(),
  notes: Joi.string().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...BOOKING_STATUSES, 'confirmed', 'in_progress').required(),
  notes: Joi.string().max(500).optional(),
});

const assignSchema = Joi.object({
  employeeIds: Joi.array().items(Joi.string()).min(1),
  employeeId: Joi.string(),
  teamLeaderId: Joi.string().optional(),
  notes: Joi.string().max(500).optional().allow(''),
}).or('employeeIds', 'employeeId');

const respondSchema = Joi.object({
  response: Joi.string().valid('accepted', 'rejected').required(),
  notes: Joi.string().max(500).optional(),
});

const scheduleVisitSchema = Joi.object({
  visitScheduledAt: Joi.date().iso().required(),
  notes: Joi.string().max(500).optional(),
});

const verifyVisitSchema = Joi.object({
  otp: Joi.string().length(6).optional(),
  qrToken: Joi.string().optional(),
}).or('otp', 'qrToken');

const checkInOutSchema = Joi.object({
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(500).optional(),
});

const updateServicesSchema = Joi.object({
  add: Joi.array()
    .items(
      Joi.object({
        serviceId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        notes: Joi.string().optional(),
      }),
    )
    .optional(),
  remove: Joi.array().items(Joi.string()).optional(),
  updateQuantity: Joi.array()
    .items(
      Joi.object({
        lineItemId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      }),
    )
    .optional(),
});

const addMaterialSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('spare_part', 'consumable').required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  notes: Joi.string().optional(),
});

const discountSchema = Joi.object({
  discountAmount: Joi.number().min(0).required(),
  discountType: Joi.string().valid('fixed', 'percentage').required(),
});

const approvalSchema = Joi.object({
  decision: Joi.string().valid('approved', 'rejected', 'changes_requested').required(),
  notes: Joi.string().max(500).optional(),
});

const completeSchema = Joi.object({
  completionPhotos: Joi.array().items(Joi.string()).optional(),
  completionNotes: Joi.string().max(1000).optional(),
  customerSignature: Joi.string().optional(),
});

const paymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid(...PAYMENT_METHODS).required(),
  transactionRef: Joi.string().optional(),
  notes: Joi.string().optional(),
});

const reviewSchema = Joi.object({
  serviceRating: Joi.number().integer().min(1).max(5).required(),
  employeeRating: Joi.number().integer().min(1).max(5).optional(),
  ownerRating: Joi.number().integer().min(1).max(5).optional(),
  title: Joi.string().max(200).optional(),
  comment: Joi.string().max(2000).optional(),
  serviceQuality: Joi.number().integer().min(1).max(5).optional(),
  behaviour: Joi.number().integer().min(1).max(5).optional(),
  punctuality: Joi.number().integer().min(1).max(5).optional(),
  pricingSatisfaction: Joi.number().integer().min(1).max(5).optional(),
});

const notesSchema = Joi.object({
  notes: Joi.string().max(500).optional(),
});

export class BookingController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const { items, meta } = await BookingService.list(req, page, limit, status);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await BookingService.getById(req, String(req.params.id));
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.create(req, req.body);
      sendCreated(res, booking);
    } catch (e) {
      next(e);
    }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.checkout(req, req.body);
      sendCreated(res, result, 'Checkout completed');
    } catch (e) {
      next(e);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.accept(req, String(req.params.id), req.body.notes);
      sendSuccess(res, booking, 'Booking accepted');
    } catch (e) {
      next(e);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.reject(req, String(req.params.id), req.body.notes);
      sendSuccess(res, booking, 'Booking rejected');
    } catch (e) {
      next(e);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.updateStatus(
        req,
        String(req.params.id),
        req.body.status,
        req.body.notes,
      );
      sendSuccess(res, booking, 'Status updated');
    } catch (e) {
      next(e);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;
      const employeeIds = body.employeeIds ?? (body.employeeId ? [body.employeeId] : []);
      const booking = await BookingService.assign(
        req,
        String(req.params.id),
        employeeIds,
        body.teamLeaderId,
        body.notes,
      );
      sendSuccess(res, booking, 'Employees assigned');
    } catch (e) {
      next(e);
    }
  }

  static async respondToAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.respondToAssignment(
        req,
        String(req.params.id),
        String(req.params.assignmentId),
        req.body.response,
        req.body.notes,
      );
      sendSuccess(res, result, 'Response recorded');
    } catch (e) {
      next(e);
    }
  }

  static async scheduleVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.scheduleVisit(
        req,
        String(req.params.id),
        req.body.visitScheduledAt,
        req.body.notes,
      );
      sendSuccess(res, booking, 'Visit scheduled');
    } catch (e) {
      next(e);
    }
  }

  static async verifyVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.verifyVisit(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Visit verified');
    } catch (e) {
      next(e);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.checkIn(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Checked in');
    } catch (e) {
      next(e);
    }
  }

  static async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.checkOut(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Checked out');
    } catch (e) {
      next(e);
    }
  }

  static async updateServices(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.updateServices(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Services updated');
    } catch (e) {
      next(e);
    }
  }

  static async addMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const material = await BookingService.addMaterial(req, String(req.params.id), req.body);
      sendCreated(res, material);
    } catch (e) {
      next(e);
    }
  }

  static async applyDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.applyDiscount(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Discount applied');
    } catch (e) {
      next(e);
    }
  }

  static async requestApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.requestCustomerApproval(
        req,
        String(req.params.id),
        req.body.notes,
      );
      sendSuccess(res, booking, 'Approval requested');
    } catch (e) {
      next(e);
    }
  }

  static async customerApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.customerApproval(
        req,
        String(req.params.id),
        req.body.decision,
        req.body.notes,
      );
      sendSuccess(res, booking, 'Response recorded');
    } catch (e) {
      next(e);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.complete(req, String(req.params.id), req.body);
      sendSuccess(res, booking, 'Booking completed');
    } catch (e) {
      next(e);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.recordPayment(req, String(req.params.id), req.body);
      sendSuccess(res, result, 'Payment recorded');
    } catch (e) {
      next(e);
    }
  }

  static async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await BookingService.submitReview(req, String(req.params.id), req.body);
      sendCreated(res, review);
    } catch (e) {
      next(e);
    }
  }

  static async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await BookingService.moderateReview(
        req,
        String(req.params.reviewId),
        req.body.status,
      );
      sendSuccess(res, review, 'Review moderated');
    } catch (e) {
      next(e);
    }
  }

  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await BookingService.getStats(req);
      sendSuccess(res, stats);
    } catch (e) {
      next(e);
    }
  }
}

export const bookingValidators = {
  create: validate(createBookingSchema),
  checkout: validate(checkoutSchema),
  updateStatus: validate(updateStatusSchema),
  assign: validate(assignSchema),
  respond: validate(respondSchema),
  scheduleVisit: validate(scheduleVisitSchema),
  verifyVisit: validate(verifyVisitSchema),
  checkInOut: validate(checkInOutSchema),
  updateServices: validate(updateServicesSchema),
  addMaterial: validate(addMaterialSchema),
  discount: validate(discountSchema),
  approval: validate(approvalSchema),
  complete: validate(completeSchema),
  payment: validate(paymentSchema),
  review: validate(reviewSchema),
  notes: validate(notesSchema),
  moderateReview: validate(Joi.object({ status: Joi.string().valid('approved', 'rejected').required() })),
};
