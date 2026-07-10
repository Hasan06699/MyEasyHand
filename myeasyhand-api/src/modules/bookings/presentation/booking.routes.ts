import { Router } from 'express';
import { BookingController, bookingValidators } from './booking.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { requireActiveSubscription } from '../../../middleware/subscription.middleware';

const router = Router();

router.use(authenticate, tenantContext);

const ownerStaff = authorizeRoles('super_admin', 'business_owner');
const ownerStaffEmployee = authorizeRoles('super_admin', 'business_owner', 'employee');
const customerOnly = authorizeRoles('customer');
const customerOrOwner = authorizeRoles('super_admin', 'business_owner', 'customer');

// Stats & list
router.get('/stats', authorize('bookings.read'), requireActiveSubscription, BookingController.stats);
router.get('/', authorize('bookings.read'), requireActiveSubscription, BookingController.list);

// Checkout (multi-service) & create (single-service legacy)
router.post('/checkout', authorize('bookings.create'), requireActiveSubscription, bookingValidators.checkout, BookingController.checkout);
router.post('/', authorize('bookings.create'), requireActiveSubscription, bookingValidators.create, BookingController.create);

// Detail
router.get('/:id', authorize('bookings.read'), requireActiveSubscription, BookingController.getById);

// Step 2: Accept / Reject
router.put('/:id/accept', ownerStaff, requireActiveSubscription, bookingValidators.notes, BookingController.accept);
router.put('/:id/reject', ownerStaff, requireActiveSubscription, bookingValidators.notes, BookingController.reject);

// Status update (admin manual + employee workflow)
router.put(
  '/:id/status',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.updateStatus,
  BookingController.updateStatus,
);

// Step 3: Employee assignment (multi-employee)
router.post(
  '/:id/assign',
  authorize('bookings.assign'),
  requireActiveSubscription,
  bookingValidators.assign,
  BookingController.assign,
);

// Step 4: Employee accept/reject assignment
router.put(
  '/:id/assignments/:assignmentId/respond',
  authorizeRoles('employee'),
  requireActiveSubscription,
  bookingValidators.respond,
  BookingController.respondToAssignment,
);

// Step 5: Visit scheduling
router.put(
  '/:id/visit-schedule',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.scheduleVisit,
  BookingController.scheduleVisit,
);

// Step 6: Visit verification & check-in
router.post(
  '/:id/verify-visit',
  authorizeRoles('employee'),
  requireActiveSubscription,
  bookingValidators.verifyVisit,
  BookingController.verifyVisit,
);
router.post(
  '/:id/check-in',
  authorizeRoles('employee'),
  requireActiveSubscription,
  bookingValidators.checkInOut,
  BookingController.checkIn,
);
router.post(
  '/:id/check-out',
  authorizeRoles('employee'),
  requireActiveSubscription,
  bookingValidators.checkInOut,
  BookingController.checkOut,
);

// Step 7: Service execution
router.put(
  '/:id/services',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.updateServices,
  BookingController.updateServices,
);
router.post(
  '/:id/materials',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.addMaterial,
  BookingController.addMaterial,
);
router.put(
  '/:id/discount',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.discount,
  BookingController.applyDiscount,
);

// Step 8-9: Customer approval
router.post(
  '/:id/request-approval',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.notes,
  BookingController.requestApproval,
);
router.put(
  '/:id/customer-approval',
  customerOnly,
  requireActiveSubscription,
  bookingValidators.approval,
  BookingController.customerApproval,
);

// Step 10: Completion
router.post(
  '/:id/complete',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.complete,
  BookingController.complete,
);

// Step 11: Payment
router.post(
  '/:id/payment',
  ownerStaffEmployee,
  requireActiveSubscription,
  bookingValidators.payment,
  BookingController.recordPayment,
);

// Step 12: Review
router.post(
  '/:id/review',
  customerOnly,
  requireActiveSubscription,
  bookingValidators.review,
  BookingController.submitReview,
);
router.put(
  '/reviews/:reviewId/moderate',
  ownerStaff,
  requireActiveSubscription,
  bookingValidators.moderateReview,
  BookingController.moderateReview,
);

export default router;
