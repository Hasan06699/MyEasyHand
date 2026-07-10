# RBAC System — MyEasyHand Platform

## Roles

| Role | Slug | Scope | Description |
|---|---|---|---|
| Super Admin | `super_admin` | Platform | Full platform access, all tenants |
| Business Owner | `business_owner` | Tenant | Manage own business, employees, services |
| Employee | `employee` | Tenant + Self | View assignments, update availability |
| Customer | `customer` | Self | Book services, manage profile |

## Permission Matrix

| Module | super_admin | business_owner | employee | customer |
|---|---|---|---|---|
| users.manage | ✅ | ✅ (tenant) | ❌ | ❌ |
| businesses.manage | ✅ | ✅ (own) | ❌ | ❌ |
| services.create | ✅ | ✅ | ❌ | ❌ |
| services.read | ✅ | ✅ | ✅ | ✅ |
| services.update | ✅ | ✅ | ❌ | ❌ |
| employees.manage | ✅ | ✅ | ❌ | ❌ |
| bookings.create | ✅ | ✅ | ❌ | ✅ |
| bookings.read | ✅ | ✅ (tenant) | ✅ (assigned) | ✅ (own) |
| bookings.update | ✅ | ✅ | ✅ (assigned) | ✅ (own) |
| bookings.assign | ✅ | ✅ | ❌ | ❌ |
| payments.manage | ✅ | ✅ | ❌ | ❌ |
| payments.create | ✅ | ✅ | ❌ | ✅ |
| notifications.send | ✅ | ✅ | ❌ | ❌ |
| reviews.create | ✅ | ❌ | ❌ | ✅ |
| settings.manage | ✅ | ✅ (tenant) | ❌ | ❌ |
| audit_logs.read | ✅ | ✅ (tenant) | ❌ | ❌ |

## JWT Payload

```json
{
  "sub": "userId",
  "email": "user@example.com",
  "roles": ["business_owner"],
  "permissions": ["services.create", "bookings.read"],
  "businessId": "tenantObjectId",
  "sessionId": "sessionObjectId",
  "iat": 1700000000,
  "exp": 1700003600
}
```

## Middleware Chain

```
Request → helmet → rateLimit → sanitize → auth → rbac → tenant → controller
```

### RBAC Middleware Usage

```typescript
// Require specific permission
router.post('/services', authenticate, authorize('services.create'), createService);

// Require any of multiple roles
router.get('/bookings', authenticate, authorizeRoles(['business_owner', 'employee']), listBookings);

// Super admin bypass
if (user.roles.includes('super_admin')) return next();
```

## Session Management

- Access token: 15 minutes
- Refresh token: 7 days (stored hashed in `sessions` collection)
- OTP: 6 digits, 10 minute expiry, max 3 attempts
- Password reset token: 1 hour expiry
- Concurrent sessions: configurable per role (default 5)

## Multi-Tenant Enforcement

```typescript
// Repository pattern — always filter by tenant
async findBookings(query: BookingQuery, ctx: RequestContext) {
  const filter: FilterQuery<Booking> = { isDeleted: false };
  
  if (!ctx.isSuperAdmin) {
    filter.businessId = ctx.businessId;
  }
  
  if (ctx.role === 'customer') {
    filter.customerId = ctx.userId;
  }
  
  if (ctx.role === 'employee') {
    filter['assignments.employeeId'] = ctx.employeeId;
  }
  
  return this.model.find(filter);
}
```
