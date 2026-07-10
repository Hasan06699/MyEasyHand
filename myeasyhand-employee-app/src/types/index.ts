export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  roleSlugs: string[];
  businessId?: string;
  status?: string;
}

export interface Business {
  _id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
}

export interface EmployeeSkill {
  _id: string;
  skillName: string;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'expert';
  serviceId?: { _id: string; name: string; slug?: string };
}

export interface AvailabilitySlot {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface EmployeeProfile {
  _id: string;
  userId: User | string;
  businessId: Business | string;
  employeeCode: string;
  employeeType: 'office_staff' | 'service_staff';
  designation: string;
  department?: string;
  hireDate?: string;
  status: 'active' | 'on_leave' | 'terminated';
  skills?: EmployeeSkill[];
  availability?: AvailabilitySlot[];
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'employee_assigned'
  | 'employee_accepted'
  | 'visit_scheduled'
  | 'visit_started'
  | 'service_in_progress'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'completed'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'
  | 'refunded'
  | 'confirmed'
  | 'in_progress';

export type PaymentStatus = 'pending' | 'partial_paid' | 'paid' | 'failed' | 'refunded';

export interface BookingLineItem {
  _id: string;
  serviceId: string | { _id: string; name: string; slug?: string };
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface BookingAssignment {
  _id: string;
  employeeId: { _id: string; employeeCode?: string; designation?: string };
  userId?: { _id: string; firstName?: string; lastName?: string; phone?: string; avatar?: string };
  employeeResponse?: 'pending' | 'accepted' | 'rejected';
  status?: string;
  respondedAt?: string;
}

export interface BookingMaterial {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StatusHistoryItem {
  fromStatus?: string;
  toStatus: string;
  changedBy?: { firstName?: string; lastName?: string };
  notes?: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  status: BookingStatus;
  scheduledAt: string;
  visitScheduledAt?: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  technicianNotes?: string;
  serviceId?: { _id: string; name: string; shortDescription?: string };
  customerId?: { _id: string; firstName?: string; lastName?: string; email?: string; phone?: string };
  businessId?: Business | string;
  visitVerification?: { otp?: string; qrToken?: string; verifiedAt?: string };
  checkIn?: { at?: string; notes?: string };
  checkOut?: { at?: string; notes?: string };
  customerApproval?: {
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    draftAmount?: number;
    notes?: string;
  };
  createdAt?: string;
}

export interface BookingDetail {
  booking: Booking;
  lineItems: BookingLineItem[];
  assignments: BookingAssignment[];
  materials: BookingMaterial[];
  payments: { _id: string; amount: number; method: string; status: string }[];
  statusHistory: StatusHistoryItem[];
}

export interface Notification {
  _id: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export type PaymentMethod = 'cash' | 'upi' | 'credit_card' | 'debit_card' | 'net_banking' | 'wallet';
