# MyEasyHand API — myeasyhand-api

Centralized API server for the MyEasyHand Service Booking Platform.

| Property | Value |
|---|---|
| **Port** | 5050 |
| **Docs** | `/api/docs` |
| **Stack** | Node.js, Express, TypeScript, MongoDB, Redis |

## Architecture

Clean Architecture with module-based structure:

```
src/modules/<module>/
├── presentation/     # Routes, controllers
├── application/      # Use cases, services
├── domain/           # Entities, business rules
└── infrastructure/   # Repositories, external adapters
```

## Quick Start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

API: http://localhost:5050  
Swagger: http://localhost:5050/api/docs (admin login required — `super_admin` or `business_owner`)

Regenerate OpenAPI path files after adding routes:

```bash
npm run swagger:generate
```

## MongoDB Collections

See [Database Schema](../doc/database/DATABASE_SCHEMA.md)

**Authentication:** users, roles, permissions, role_permissions, user_roles, sessions  
**Master:** countries, states, cities, areas, settings, audit_logs  
**Business:** businesses, business_documents, business_settings, subscriptions, plans  
**Services:** service_categories, service_subcategories, services, service_images, service_pricing, service_availability  
**Employees:** employees, employee_documents, employee_skills, employee_availability  
**Customers:** customers, customer_addresses  
**Bookings:** bookings, booking_services, booking_assignments, booking_status_history  
**Payments:** payments, refunds, transactions  
**Notifications:** notifications, notification_templates  
**Reviews:** reviews, ratings  
**Files:** media, documents

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run seed` | Seed database |

## Branch Strategy

```
development → staging → main
```

## Contact

- info@myeasyhand.in | +91 8818907445
