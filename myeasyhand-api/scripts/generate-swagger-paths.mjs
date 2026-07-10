import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../src/docs/paths');

const routes = [
  { tag: 'Health', paths: [
    { method: 'get', path: '/health', summary: 'Health check', public: true },
    { method: 'get', path: '/health/ready', summary: 'Readiness check (MongoDB + Redis)', public: true },
  ]},
  { tag: 'Auth', paths: [
    { method: 'post', path: '/auth/register', summary: 'Register new user', public: true },
    { method: 'post', path: '/auth/login', summary: 'User login', public: true },
    { method: 'post', path: '/auth/google', summary: 'Google OAuth login', public: true },
    { method: 'post', path: '/auth/refresh', summary: 'Refresh access token', public: true },
    { method: 'post', path: '/auth/logout', summary: 'Logout current session' },
    { method: 'get', path: '/auth/me', summary: 'Get current user profile' },
    { method: 'put', path: '/auth/me', summary: 'Update current user profile' },
    { method: 'post', path: '/auth/verify-otp', summary: 'Verify email OTP', public: true },
    { method: 'post', path: '/auth/resend-otp', summary: 'Resend verification OTP', public: true },
    { method: 'post', path: '/auth/forgot-password', summary: 'Request password reset', public: true },
    { method: 'post', path: '/auth/reset-password', summary: 'Reset password with token', public: true },
    { method: 'post', path: '/auth/devices/register', summary: 'Register push notification device' },
    { method: 'post', path: '/auth/devices/unregister', summary: 'Unregister push device' },
    { method: 'get', path: '/auth/devices', summary: 'List registered devices' },
  ]},
  { tag: 'Businesses', paths: [
    { method: 'get', path: '/businesses/public', summary: 'List public businesses', public: true },
    { method: 'get', path: '/businesses/public/{slug}', summary: 'Get business by slug', public: true, params: ['slug'] },
    { method: 'get', path: '/businesses', summary: 'List businesses (admin)', list: true },
    { method: 'get', path: '/businesses/{id}', summary: 'Get business by ID', params: ['id'] },
    { method: 'post', path: '/businesses', summary: 'Create business' },
    { method: 'put', path: '/businesses/{id}', summary: 'Update business', params: ['id'] },
    { method: 'delete', path: '/businesses/{id}', summary: 'Delete business', params: ['id'] },
  ]},
  { tag: 'Services', paths: [
    { method: 'get', path: '/services/categories', summary: 'List service categories', public: true, list: true },
    { method: 'get', path: '/services/categories/{id}', summary: 'Get category by ID', params: ['id'] },
    { method: 'post', path: '/services/categories', summary: 'Create category' },
    { method: 'put', path: '/services/categories/{id}', summary: 'Update category', params: ['id'] },
    { method: 'delete', path: '/services/categories/{id}', summary: 'Delete category', params: ['id'] },
    { method: 'get', path: '/services/category-requests', summary: 'List category requests', list: true },
    { method: 'post', path: '/services/category-requests', summary: 'Create category request' },
    { method: 'put', path: '/services/category-requests/{id}/approve', summary: 'Approve category request', params: ['id'] },
    { method: 'put', path: '/services/category-requests/{id}/reject', summary: 'Reject category request', params: ['id'] },
    { method: 'get', path: '/services/feature-requests', summary: 'List feature requests', list: true },
    { method: 'post', path: '/services/feature-requests', summary: 'Create feature request' },
    { method: 'put', path: '/services/feature-requests/{id}/approve', summary: 'Approve feature request', params: ['id'] },
    { method: 'put', path: '/services/feature-requests/{id}/reject', summary: 'Reject feature request', params: ['id'] },
    { method: 'get', path: '/services', summary: 'List services', public: true, list: true },
    { method: 'post', path: '/services', summary: 'Create service' },
    { method: 'get', path: '/services/{id}', summary: 'Get service by ID', public: true, params: ['id'] },
    { method: 'put', path: '/services/{id}', summary: 'Update service', params: ['id'] },
    { method: 'delete', path: '/services/{id}', summary: 'Delete service', params: ['id'] },
    { method: 'put', path: '/services/{id}/approve', summary: 'Approve service', params: ['id'] },
    { method: 'post', path: '/services/{id}/gallery', summary: 'Add gallery image', params: ['id'] },
    { method: 'delete', path: '/services/{id}/gallery/{galleryId}', summary: 'Remove gallery image', params: ['id', 'galleryId'] },
  ]},
  { tag: 'Bookings', paths: [
    { method: 'get', path: '/bookings/stats', summary: 'Booking statistics' },
    { method: 'get', path: '/bookings', summary: 'List bookings', list: true },
    { method: 'post', path: '/bookings', summary: 'Create booking' },
    { method: 'post', path: '/bookings/checkout', summary: 'Checkout cart to booking' },
    { method: 'get', path: '/bookings/{id}', summary: 'Get booking by ID', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/accept', summary: 'Accept booking', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/reject', summary: 'Reject booking', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/status', summary: 'Update booking status', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/assign', summary: 'Assign employee to booking', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/assignments/{assignmentId}/respond', summary: 'Employee respond to assignment', params: ['id', 'assignmentId'] },
    { method: 'put', path: '/bookings/{id}/visit-schedule', summary: 'Schedule visit', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/verify-visit', summary: 'Verify visit OTP', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/check-in', summary: 'Employee check-in', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/check-out', summary: 'Employee check-out', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/services', summary: 'Update booking services', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/materials', summary: 'Add material charges', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/discount', summary: 'Apply discount', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/request-approval', summary: 'Request customer approval', params: ['id'] },
    { method: 'put', path: '/bookings/{id}/customer-approval', summary: 'Customer approve/reject changes', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/complete', summary: 'Complete booking', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/payment', summary: 'Record payment', params: ['id'] },
    { method: 'post', path: '/bookings/{id}/review', summary: 'Submit booking review', params: ['id'] },
    { method: 'put', path: '/bookings/reviews/{reviewId}/moderate', summary: 'Moderate review', params: ['reviewId'] },
  ]},
  { tag: 'Media', paths: [
    { method: 'post', path: '/media/category-image', summary: 'Upload category image', multipart: true },
    { method: 'post', path: '/media/service-image', summary: 'Upload service image', multipart: true },
    { method: 'post', path: '/media/service-gallery', summary: 'Upload service gallery image', multipart: true },
    { method: 'post', path: '/media/business-document', summary: 'Upload business document', multipart: true },
    { method: 'post', path: '/media/promotion-background-image', summary: 'Upload promotion background image', multipart: true },
    { method: 'post', path: '/media/promotion-background-video', summary: 'Upload promotion background video', multipart: true },
  ]},
  { tag: 'Plans', paths: [
    { method: 'get', path: '/plans/public', summary: 'List public subscription plans', public: true },
    { method: 'get', path: '/plans/public/{id}', summary: 'Get public plan by ID', public: true, params: ['id'] },
    { method: 'get', path: '/plans', summary: 'List all plans (admin)', list: true },
    { method: 'get', path: '/plans/{id}', summary: 'Get plan by ID', params: ['id'] },
    { method: 'post', path: '/plans', summary: 'Create plan' },
    { method: 'put', path: '/plans/{id}', summary: 'Update plan', params: ['id'] },
    { method: 'delete', path: '/plans/{id}', summary: 'Delete plan', params: ['id'] },
  ]},
  { tag: 'Subscriptions', paths: [
    { method: 'get', path: '/subscriptions/status', summary: 'Get subscription status' },
    { method: 'get', path: '/subscriptions/me', summary: 'Get my subscription' },
    { method: 'get', path: '/subscriptions', summary: 'List subscriptions (admin)', list: true },
    { method: 'get', path: '/subscriptions/{id}', summary: 'Get subscription by ID', params: ['id'] },
    { method: 'post', path: '/subscriptions', summary: 'Assign subscription' },
    { method: 'put', path: '/subscriptions/{id}', summary: 'Update subscription', params: ['id'] },
    { method: 'put', path: '/subscriptions/{id}/renew', summary: 'Renew subscription', params: ['id'] },
    { method: 'put', path: '/subscriptions/{id}/cancel', summary: 'Cancel subscription', params: ['id'] },
    { method: 'delete', path: '/subscriptions/{id}', summary: 'Delete subscription', params: ['id'] },
  ]},
  { tag: 'Plan Requests', paths: [
    { method: 'get', path: '/plan-requests', summary: 'List plan requests', list: true },
    { method: 'post', path: '/plan-requests', summary: 'Create plan request' },
    { method: 'put', path: '/plan-requests/{id}/approve', summary: 'Approve plan request', params: ['id'] },
    { method: 'put', path: '/plan-requests/{id}/reject', summary: 'Reject plan request', params: ['id'] },
  ]},
  { tag: 'Notifications', paths: [
    { method: 'get', path: '/notifications/unread-count', summary: 'Get unread notification count' },
    { method: 'get', path: '/notifications/admin', summary: 'List admin notifications', list: true },
    { method: 'post', path: '/notifications/send', summary: 'Send notification' },
    { method: 'put', path: '/notifications/read-all', summary: 'Mark all notifications as read' },
    { method: 'get', path: '/notifications', summary: 'List my notifications', list: true },
    { method: 'put', path: '/notifications/{id}/read', summary: 'Mark notification as read', params: ['id'] },
  ]},
  { tag: 'Service Owners', paths: [
    { method: 'get', path: '/service-owners/documents/list', summary: 'List owner documents', list: true },
    { method: 'post', path: '/service-owners/documents', summary: 'Upload owner document' },
    { method: 'put', path: '/service-owners/documents/{id}/approve', summary: 'Approve document', params: ['id'] },
    { method: 'put', path: '/service-owners/documents/{id}/reject', summary: 'Reject document', params: ['id'] },
    { method: 'get', path: '/service-owners', summary: 'List service owners', list: true },
    { method: 'post', path: '/service-owners', summary: 'Create service owner' },
    { method: 'get', path: '/service-owners/{id}', summary: 'Get service owner profile', params: ['id'] },
    { method: 'put', path: '/service-owners/{id}', summary: 'Update service owner', params: ['id'] },
    { method: 'put', path: '/service-owners/{id}/reset-password', summary: 'Reset owner password', params: ['id'] },
    { method: 'put', path: '/service-owners/{id}/auto-approve', summary: 'Toggle auto-approve', params: ['id'] },
    { method: 'put', path: '/service-owners/{id}/suspend', summary: 'Suspend service owner', params: ['id'] },
    { method: 'put', path: '/service-owners/{id}/activate', summary: 'Activate service owner', params: ['id'] },
  ]},
  { tag: 'Audit Logs', paths: [
    { method: 'get', path: '/audit-logs', summary: 'List audit logs', list: true },
  ]},
  { tag: 'Employees', paths: [
    { method: 'get', path: '/employees/stats', summary: 'Employee statistics' },
    { method: 'get', path: '/employees/service-staff', summary: 'List service staff for assignment', list: true },
    { method: 'get', path: '/employees', summary: 'List employees', list: true },
    { method: 'post', path: '/employees', summary: 'Create employee' },
    { method: 'get', path: '/employees/me', summary: 'Get current employee profile' },
    { method: 'get', path: '/employees/{id}', summary: 'Get employee by ID', params: ['id'] },
    { method: 'get', path: '/employees/{id}/performance', summary: 'Get employee performance', params: ['id'] },
    { method: 'get', path: '/employees/{id}/activities', summary: 'Get employee activities', params: ['id'] },
    { method: 'put', path: '/employees/{id}', summary: 'Update employee', params: ['id'] },
    { method: 'put', path: '/employees/{id}/skills', summary: 'Update employee skills', params: ['id'] },
    { method: 'put', path: '/employees/{id}/availability', summary: 'Update employee availability', params: ['id'] },
    { method: 'delete', path: '/employees/{id}', summary: 'Delete employee', params: ['id'] },
  ]},
  { tag: 'Customers', paths: [
    { method: 'get', path: '/customers/stats', summary: 'Customer statistics' },
    { method: 'get', path: '/customers', summary: 'List customers', list: true },
    { method: 'post', path: '/customers', summary: 'Create customer' },
    { method: 'get', path: '/customers/{id}', summary: 'Get customer by ID', params: ['id'] },
    { method: 'post', path: '/customers/{id}/view-password', summary: 'View customer password (admin)', params: ['id'] },
    { method: 'put', path: '/customers/{id}', summary: 'Update customer', params: ['id'] },
    { method: 'delete', path: '/customers/{id}', summary: 'Delete customer', params: ['id'] },
  ]},
  { tag: 'Owner Profile', paths: [
    { method: 'get', path: '/owner-profile', summary: 'Get owner profile overview' },
    { method: 'put', path: '/owner-profile/personal', summary: 'Update personal info' },
    { method: 'put', path: '/owner-profile/address', summary: 'Update address' },
    { method: 'put', path: '/owner-profile/preferences', summary: 'Update preferences' },
    { method: 'put', path: '/owner-profile/account', summary: 'Update account settings' },
    { method: 'put', path: '/owner-profile/password', summary: 'Change password' },
    { method: 'get', path: '/owner-profile/login-activity', summary: 'Get login activity' },
    { method: 'put', path: '/owner-profile/business', summary: 'Update business profile' },
    { method: 'get', path: '/owner-profile/payment', summary: 'Get payment settings' },
    { method: 'put', path: '/owner-profile/payment', summary: 'Update payment settings' },
    { method: 'get', path: '/owner-profile/payment/earnings', summary: 'Get earnings summary' },
  ]},
  { tag: 'Coupons', paths: [
    { method: 'get', path: '/coupons/available', summary: 'List available coupons for customer' },
    { method: 'post', path: '/coupons/validate', summary: 'Validate coupon code' },
    { method: 'get', path: '/coupons/stats', summary: 'Coupon statistics' },
    { method: 'get', path: '/coupons', summary: 'List coupons', list: true },
    { method: 'get', path: '/coupons/{id}', summary: 'Get coupon by ID', params: ['id'] },
    { method: 'post', path: '/coupons', summary: 'Create coupon' },
    { method: 'put', path: '/coupons/{id}', summary: 'Update coupon', params: ['id'] },
    { method: 'delete', path: '/coupons/{id}', summary: 'Delete coupon', params: ['id'] },
    { method: 'post', path: '/coupons/{id}/duplicate', summary: 'Duplicate coupon', params: ['id'] },
    { method: 'put', path: '/coupons/{id}/disable', summary: 'Disable coupon', params: ['id'] },
  ]},
  { tag: 'Promotions', paths: [
    { method: 'get', path: '/promotions/banners/active', summary: 'List active promotion banners', public: true },
    { method: 'get', path: '/promotions/banners/active/{id}', summary: 'Get active banner by ID', public: true, params: ['id'] },
    { method: 'get', path: '/promotions/service-rows/active', summary: 'List active service rows', public: true },
    { method: 'post', path: '/promotions/track', summary: 'Track promotion event' },
    { method: 'get', path: '/promotions/stats', summary: 'Promotion statistics' },
    { method: 'get', path: '/promotions/banners', summary: 'List promotion banners', list: true },
    { method: 'get', path: '/promotions/banners/{id}', summary: 'Get banner by ID', params: ['id'] },
    { method: 'post', path: '/promotions/banners', summary: 'Create promotion banner' },
    { method: 'put', path: '/promotions/banners/{id}', summary: 'Update promotion banner', params: ['id'] },
    { method: 'delete', path: '/promotions/banners/{id}', summary: 'Delete promotion banner', params: ['id'] },
    { method: 'put', path: '/promotions/banners/{id}/submit', summary: 'Submit banner for approval', params: ['id'] },
    { method: 'put', path: '/promotions/banners/{id}/approve', summary: 'Approve banner', params: ['id'] },
    { method: 'put', path: '/promotions/banners/{id}/reject', summary: 'Reject banner', params: ['id'] },
    { method: 'get', path: '/promotions/service-rows', summary: 'List service rows', list: true },
    { method: 'get', path: '/promotions/service-rows/{id}', summary: 'Get service row by ID', params: ['id'] },
    { method: 'post', path: '/promotions/service-rows', summary: 'Create service row' },
    { method: 'put', path: '/promotions/service-rows/{id}', summary: 'Update service row', params: ['id'] },
    { method: 'delete', path: '/promotions/service-rows/{id}', summary: 'Delete service row', params: ['id'] },
    { method: 'put', path: '/promotions/service-rows/{id}/submit', summary: 'Submit service row for approval', params: ['id'] },
    { method: 'put', path: '/promotions/service-rows/{id}/approve', summary: 'Approve service row', params: ['id'] },
    { method: 'put', path: '/promotions/service-rows/{id}/reject', summary: 'Reject service row', params: ['id'] },
  ]},
  { tag: 'Cart', paths: [
    { method: 'get', path: '/cart', summary: 'Get cart' },
    { method: 'get', path: '/cart/events', summary: 'Cart SSE events stream' },
    { method: 'put', path: '/cart', summary: 'Save/update cart' },
    { method: 'delete', path: '/cart', summary: 'Clear cart' },
  ]},
  { tag: 'Platform Settings', paths: [
    { method: 'get', path: '/platform-settings/public', summary: 'Get public platform settings', public: true },
    { method: 'get', path: '/platform-settings/auth', summary: 'Get auth settings (admin)' },
    { method: 'put', path: '/platform-settings/auth', summary: 'Update auth settings (admin)' },
  ]},
];

function yamlEscape(str) {
  return str.replace(/'/g, "''");
}

function buildParameters(route) {
  const lines = [];
  const params = route.params ?? [];

  if (params.length > 0) {
    lines.push('      parameters:');
    for (const name of params) {
      lines.push(`        - name: ${name}`);
      lines.push('          in: path');
      lines.push('          required: true');
      lines.push('          schema:');
      lines.push('            type: string');
    }
  }

  if (route.list) {
    if (lines.length === 0) lines.push('      parameters:');
    lines.push('        - name: page');
    lines.push('          in: query');
    lines.push('          schema: { type: integer, default: 1 }');
    lines.push('        - name: limit');
    lines.push('          in: query');
    lines.push('          schema: { type: integer, default: 20 }');
  }

  return lines;
}

function buildOperation(route) {
  const lines = [];
  lines.push(`      summary: '${yamlEscape(route.summary)}'`);
  lines.push(`      tags: [${route.tag}]`);

  if (route.public) {
    lines.push('      security: []');
  } else {
    lines.push('      security:');
    lines.push('        - bearerAuth: []');
  }

  lines.push(...buildParameters(route));

  if (route.method !== 'get' && route.method !== 'delete') {
    if (route.multipart) {
      lines.push('      requestBody:');
      lines.push('        required: true');
      lines.push('        content:');
      lines.push('          multipart/form-data:');
      lines.push('            schema:');
      lines.push('              type: object');
      lines.push('              properties:');
      lines.push('                file:');
      lines.push('                  type: string');
      lines.push('                  format: binary');
    } else {
      lines.push('      requestBody:');
      lines.push('        required: true');
      lines.push('        content:');
      lines.push('          application/json:');
      lines.push('            schema:');
      lines.push('              type: object');
    }
  }

  const successCode = route.method === 'post' ? '201' : '200';
  lines.push('      responses:');
  lines.push(`        '${successCode}':`);
  lines.push('          description: Success');
  lines.push("        '401':");
  lines.push('          description: Unauthorized');
  if (!route.public) {
    lines.push("        '403':");
    lines.push('          description: Forbidden');
  }

  return lines.join('\n');
}

function generateModuleFile(module) {
  const grouped = new Map();

  for (const route of module.paths) {
    if (!grouped.has(route.path)) {
      grouped.set(route.path, []);
    }
    grouped.get(route.path).push({ ...route, tag: module.tag });
  }

  const lines = ['paths:'];

  for (const [pathKey, pathRoutes] of grouped) {
    lines.push(`  ${pathKey}:`);
    for (const route of pathRoutes) {
      lines.push(`    ${route.method}:`);
      lines.push(buildOperation(route));
    }
    lines.push('');
  }

  return lines.join('\n');
}

fs.mkdirSync(outputDir, { recursive: true });

for (const module of routes) {
  const slug = module.tag.toLowerCase().replace(/\s+/g, '-');
  const filePath = path.join(outputDir, `${slug}.yaml`);
  fs.writeFileSync(filePath, generateModuleFile(module));
  console.log(`Wrote ${filePath} (${module.paths.length} endpoints)`);
}

console.log(`\nTotal modules: ${routes.length}`);
console.log(`Total endpoints: ${routes.reduce((sum, m) => sum + m.paths.length, 0)}`);
