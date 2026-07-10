# REST API Endpoints — MyEasyHand Platform

**Base URL:** `https://api.myeasyhand.in/api/v1`  
**Docs:** `https://api.myeasyhand.in/api/docs`

---

## Authentication `/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login with email/password | Public |
| POST | `/auth/logout` | Revoke session | JWT |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/auth/verify-otp` | Verify email/phone OTP | Public |
| POST | `/auth/resend-otp` | Resend OTP | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |
| GET | `/auth/me` | Current user profile | JWT |

## Users `/users`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/users` | List users | Super Admin, Business Owner |
| GET | `/users/:id` | Get user | Admin, Self |
| PUT | `/users/:id` | Update user | Admin, Self |
| DELETE | `/users/:id` | Soft delete user | Super Admin |
| PUT | `/users/:id/roles` | Assign roles | Super Admin, Business Owner |

## Roles & Permissions `/roles`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/roles` | List roles | Super Admin |
| POST | `/roles` | Create role | Super Admin |
| GET | `/permissions` | List permissions | Super Admin |
| POST | `/roles/:id/permissions` | Assign permissions | Super Admin |

## Master Data `/master`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/master/countries` | List countries |
| GET | `/master/states/:countryId` | List states |
| GET | `/master/cities/:stateId` | List cities |
| GET | `/master/areas/:cityId` | List areas |
| GET | `/master/settings` | Get settings |
| PUT | `/master/settings` | Update settings | Super Admin |

## Businesses `/businesses`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/businesses` | List businesses | Super Admin |
| POST | `/businesses` | Create business | Super Admin, Business Owner |
| GET | `/businesses/:id` | Get business | Admin, Owner |
| PUT | `/businesses/:id` | Update business | Admin, Owner |
| DELETE | `/businesses/:id` | Delete business | Super Admin |
| POST | `/businesses/:id/documents` | Upload KYC docs | Business Owner |
| GET | `/businesses/:id/settings` | Get business settings | Business Owner |
| PUT | `/businesses/:id/settings` | Update settings | Business Owner |

## Subscriptions `/subscriptions`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/plans` | List subscription plans | Public |
| GET | `/subscriptions` | List subscriptions | Super Admin |
| POST | `/subscriptions` | Create subscription | Business Owner |
| PUT | `/subscriptions/:id` | Update subscription | Super Admin |

## Services `/services`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/service-categories` | List categories | All |
| POST | `/service-categories` | Create category | Business Owner |
| GET | `/services` | List services | All |
| POST | `/services` | Create service | Business Owner |
| GET | `/services/:id` | Get service detail | All |
| PUT | `/services/:id` | Update service | Business Owner |
| DELETE | `/services/:id` | Delete service | Business Owner |
| POST | `/services/:id/images` | Upload images | Business Owner |
| PUT | `/services/:id/pricing` | Update pricing | Business Owner |
| PUT | `/services/:id/availability` | Set availability | Business Owner |

## Employees `/employees`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/employees` | List employees | Business Owner |
| POST | `/employees` | Create employee | Business Owner |
| GET | `/employees/:id` | Get employee | Business Owner, Self |
| PUT | `/employees/:id` | Update employee | Business Owner |
| DELETE | `/employees/:id` | Delete employee | Business Owner |
| PUT | `/employees/:id/skills` | Update skills | Business Owner |
| PUT | `/employees/:id/availability` | Set availability | Employee, Owner |

## Customers `/customers`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/customers` | List customers | Business Owner |
| GET | `/customers/:id` | Get customer | Business Owner, Self |
| PUT | `/customers/:id` | Update customer | Self |
| POST | `/customers/:id/addresses` | Add address | Customer |
| PUT | `/customers/:id/addresses/:addressId` | Update address | Customer |

## Bookings `/bookings`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/bookings` | List bookings | All (scoped) |
| POST | `/bookings` | Create booking | Customer |
| GET | `/bookings/:id` | Get booking | Scoped |
| PUT | `/bookings/:id` | Update booking | Customer, Owner |
| PUT | `/bookings/:id/status` | Update status | Owner, Employee |
| POST | `/bookings/:id/assign` | Assign employee | Business Owner |
| GET | `/bookings/:id/history` | Status history | Scoped |
| DELETE | `/bookings/:id` | Cancel booking | Customer, Owner |

## Payments `/payments`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/payments` | List payments | Business Owner |
| POST | `/payments` | Initiate payment | Customer |
| GET | `/payments/:id` | Get payment | Scoped |
| POST | `/payments/:id/refund` | Process refund | Business Owner |
| GET | `/transactions` | List transactions | Business Owner |

## Notifications `/notifications`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/notifications` | List notifications | JWT |
| PUT | `/notifications/:id/read` | Mark as read | JWT |
| PUT | `/notifications/read-all` | Mark all read | JWT |
| POST | `/notifications/push` | Send push (admin) | Super Admin, Owner |
| GET | `/notification-templates` | List templates | Super Admin |

## Reviews `/reviews`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/reviews` | List reviews | All |
| POST | `/reviews` | Create review | Customer |
| PUT | `/reviews/:id` | Update review | Customer |
| DELETE | `/reviews/:id` | Delete review | Super Admin |

## Media `/media`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/media/upload` | Upload file | JWT |
| DELETE | `/media/:id` | Delete file | Owner |

## Health `/health`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |

---

## Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
