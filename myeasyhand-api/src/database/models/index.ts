/**
 * MongoDB Model Registry — MyEasyHand Platform
 *
 * Models are organized by domain. Each model file exports a Mongoose schema + model.
 * See: doc/database/DATABASE_SCHEMA.md
 */

// Authentication
export const AUTH_MODELS = [
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'sessions',
] as const;

// Master Data
export const MASTER_MODELS = [
  'countries',
  'states',
  'cities',
  'areas',
  'settings',
  'audit_logs',
] as const;

// Business
export const BUSINESS_MODELS = [
  'businesses',
  'business_documents',
  'business_settings',
  'subscriptions',
  'plans',
] as const;

// Services
export const SERVICE_MODELS = [
  'service_categories',
  'service_subcategories',
  'services',
  'service_images',
  'service_pricing',
  'service_availability',
] as const;

// Employees
export const EMPLOYEE_MODELS = [
  'employees',
  'employee_documents',
  'employee_skills',
  'employee_availability',
] as const;

// Customers
export const CUSTOMER_MODELS = ['customers', 'customer_addresses'] as const;

// Bookings
export const BOOKING_MODELS = [
  'bookings',
  'booking_services',
  'booking_assignments',
  'booking_status_history',
] as const;

// Payments
export const PAYMENT_MODELS = ['payments', 'refunds', 'transactions'] as const;

// Notifications
export const NOTIFICATION_MODELS = ['notifications', 'notification_templates'] as const;

// Reviews
export const REVIEW_MODELS = ['reviews', 'ratings'] as const;

// Files
export const FILE_MODELS = ['media', 'documents'] as const;

export const ALL_MODELS = [
  ...AUTH_MODELS,
  ...MASTER_MODELS,
  ...BUSINESS_MODELS,
  ...SERVICE_MODELS,
  ...EMPLOYEE_MODELS,
  ...CUSTOMER_MODELS,
  ...BOOKING_MODELS,
  ...PAYMENT_MODELS,
  ...NOTIFICATION_MODELS,
  ...REVIEW_MODELS,
  ...FILE_MODELS,
] as const;

export type ModelName = (typeof ALL_MODELS)[number];
