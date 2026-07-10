# MongoDB Database Schema — MyEasyHand Platform

**Database:** `myeasyhand_production` | **Engine:** MongoDB 7+ | **ODM:** Mongoose

All tenant-scoped documents include `businessId: ObjectId` (indexed). All documents include `createdAt`, `updatedAt`, `isDeleted` (soft delete).

---

## Authentication

### users
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | PK |
| email | String | unique, indexed |
| phone | String | unique, sparse |
| passwordHash | String | bcrypt |
| firstName | String | |
| lastName | String | |
| avatar | String | media URL |
| isEmailVerified | Boolean | default false |
| isPhoneVerified | Boolean | default false |
| status | Enum | active, inactive, suspended |
| lastLoginAt | Date | |
| businessId | ObjectId | nullable, tenant scope |

### roles
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| name | String | super_admin, business_owner, employee, customer |
| slug | String | unique |
| description | String | |
| isSystem | Boolean | cannot delete |

### permissions
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| name | String | e.g. bookings.create |
| module | String | bookings, services, etc. |
| action | Enum | create, read, update, delete, manage |

### role_permissions
| Field | Type |
|---|---|
| roleId | ObjectId → roles |
| permissionId | ObjectId → permissions |

### user_roles
| Field | Type |
|---|---|
| userId | ObjectId → users |
| roleId | ObjectId → roles |
| businessId | ObjectId | nullable |

### sessions
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | |
| refreshToken | String | hashed |
| deviceInfo | Object | userAgent, ip, platform |
| expiresAt | Date | TTL index |
| isRevoked | Boolean | |

---

## Master Data

### countries / states / cities / areas
Hierarchical location data with `name`, `code`, `parentId`, `isActive`.

### settings
Platform and tenant settings: `key`, `value`, `type`, `businessId` (null = global).

### audit_logs
| Field | Type |
|---|---|
| userId | ObjectId |
| businessId | ObjectId |
| action | String |
| module | String |
| resourceId | ObjectId |
| oldValue | Mixed |
| newValue | Mixed |
| ip | String |
| userAgent | String |

---

## Business

### businesses
| Field | Type | Notes |
|---|---|---|
| name | String | |
| slug | String | unique |
| email | String | |
| phone | String | |
| logo | String | |
| address | Object | street, city, state, country, zip |
| status | Enum | pending, active, suspended |
| ownerId | ObjectId → users |
| subscriptionId | ObjectId | |

### business_documents
KYC documents: `businessId`, `type`, `url`, `status`, `verifiedAt`.

### business_settings
Tenant config: booking rules, cancellation policy, working hours.

### subscriptions / plans
SaaS billing: plan tiers, features, limits, billing cycle.

---

## Services

### service_categories / service_subcategories
Hierarchical: `name`, `slug`, `businessId`, `icon`, `sortOrder`.

### services
| Field | Type |
|---|---|
| businessId | ObjectId |
| categoryId | ObjectId |
| subcategoryId | ObjectId |
| name | String |
| description | String |
| duration | Number | minutes |
| status | Enum | active, inactive |

### service_images / service_pricing / service_availability
Linked to `serviceId`. Pricing: base price, variants. Availability: day-of-week slots.

---

## Employees

### employees
| Field | Type |
|---|---|
| userId | ObjectId → users |
| businessId | ObjectId |
| employeeCode | String |
| designation | String |
| status | Enum | active, on_leave, terminated |

### employee_documents / employee_skills / employee_availability
Linked to `employeeId`.

---

## Customers

### customers
| Field | Type |
|---|---|
| userId | ObjectId → users |
| businessId | ObjectId | nullable for platform customers |

### customer_addresses
Multiple addresses per customer with `isDefault`, geo coordinates.

---

## Bookings

### bookings
| Field | Type | Notes |
|---|---|---|
| bookingNumber | String | unique |
| customerId | ObjectId |
| businessId | ObjectId |
| status | Enum | pending, confirmed, in_progress, completed, cancelled |
| scheduledAt | Date | |
| totalAmount | Number | |
| paymentStatus | Enum | unpaid, paid, refunded |

### booking_services / booking_assignments / booking_status_history
Line items, employee assignments, status audit trail.

---

## Payments

### payments / refunds / transactions
Payment gateway refs, amounts, status, bookingId linkage.

---

## Notifications

### notifications
In-app notifications: `userId`, `type`, `title`, `body`, `data`, `isRead`.

### notification_templates
Reusable templates with variable placeholders.

---

## Reviews

### reviews / ratings
`bookingId`, `customerId`, `employeeId`, `rating` (1-5), `comment`.

---

## Files

### media / documents
`url`, `mimeType`, `size`, `uploadedBy`, `businessId`.

---

## Indexes Strategy

```javascript
// Compound tenant indexes (apply to all tenant collections)
{ businessId: 1, status: 1 }
{ businessId: 1, createdAt: -1 }

// Unique constraints
users: { email: 1 } unique
businesses: { slug: 1 } unique
bookings: { bookingNumber: 1 } unique
sessions: { expiresAt: 1 } TTL
```
