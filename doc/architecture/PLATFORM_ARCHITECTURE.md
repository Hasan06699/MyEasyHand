# MyEasyHand Platform — Enterprise Architecture

> **Brand:** MyEasyHand | **Domain:** myeasyhand.in | **Org:** myeasyhand-platform

## Overview

MyEasyHand is a multi-tenant SaaS service booking platform with five independent repositories, unified by a centralized API and shared authentication/RBAC layer.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Cloudflare (DNS + SSL + CDN)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                              ┌───────▼───────┐
                              │  Nginx (VPS)  │
                              │  Reverse Proxy│
                              └───────┬───────┘
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
   ┌──────▼──────┐            ┌───────▼───────┐           ┌───────▼───────┐
   │  Web :3030  │            │ Admin :8080   │           │  API :5050    │
   │  Next.js    │            │  Next.js      │           │  Express.js   │
   └─────────────┘            └───────────────┘           └───────┬───────┘
                                                                  │
                          ┌───────────────────┬───────────────────┤
                          │                   │                   │
                   ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
                   │  MongoDB    │     │   Redis     │     │  OneSignal  │
                   │  :27017     │     │   :6379     │     │  Push API   │
                   └─────────────┘     └─────────────┘     └─────────────┘

   ┌─────────────────────┐                    ┌─────────────────────┐
   │ Customer App        │                    │ Employee App        │
   │ React Native/Expo   │                    │ React Native/Expo   │
   │ iOS + Android       │                    │ iOS + Android       │
   └─────────────────────┘                    └─────────────────────┘
```

## Repository Map

| Repository | Port | Technology | Purpose |
|---|---|---|---|
| `myeasyhand-api` | 5050 | Node.js, Express, TypeScript, MongoDB, Redis | Central API |
| `myeasyhand-web` | 3030 | Next.js 15+, Tailwind, ShadCN, React Query, Zustand | Customer website |
| `myeasyhand-admin` | 8080 | Next.js 15+, MaterialPro, ShadCN, React Query, Zustand | Admin panel |
| `myeasyhand-customer-app` | — | React Native, Expo, Redux Toolkit, OneSignal | Customer mobile |
| `myeasyhand-employee-app` | — | React Native, Expo, Redux Toolkit, OneSignal | Employee mobile |

## Git Organization

**GitHub Org:** `myeasyhand-platform`

### Branch Strategy (All Repos)

```
feature/* ──┐
bugfix/*  ──┼──► development ──► staging ──► main
hotfix/*  ──┘
release/*
```

| Branch | Environment | Auto Deploy |
|---|---|---|
| `development` | Development | Yes |
| `staging` | Staging | Yes |
| `main` | Production | Yes |

## Clean Architecture Layers

Every backend module follows:

```
modules/<module>/
├── presentation/     # Controllers, routes, DTOs, HTTP handlers
├── application/    # Use cases, services, orchestration
├── domain/         # Entities, value objects, domain rules
└── infrastructure/ # Repositories, external APIs, DB adapters
```

## Multi-Tenant SaaS Model

- **Tenant isolation:** `businessId` on all tenant-scoped collections
- **Super Admin:** Platform-wide access, no tenant scope
- **Business Owner:** Scoped to own `businessId`
- **Employee:** Scoped to assigned business + own assignments
- **Customer:** Scoped to own profile and bookings

### Tenant Resolution

1. JWT contains `userId`, `roles`, and optional `businessId`
2. Middleware `tenantContext` injects tenant scope into request
3. Repository layer enforces `businessId` filter on all queries
4. Super Admin bypasses tenant filter with explicit audit logging

## Domain URLs (Production)

| Service | URL |
|---|---|
| Customer Web | https://myeasyhand.in |
| Admin Panel | https://admin.myeasyhand.in |
| API | https://api.myeasyhand.in |
| API Docs | https://api.myeasyhand.in/api/docs |

## Contact

- Support: info@myeasyhand.in
- Business: myeasyhandservice@gmail.com
- Phone: +91 8818907445
