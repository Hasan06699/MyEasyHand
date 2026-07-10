# MyEasyHand — Service Booking SaaS Platform

Enterprise-grade multi-tenant local service booking platform.

| Property | Value |
|---|---|
| **Brand** | MyEasyHand |
| **Domain** | [myeasyhand.in](https://myeasyhand.in) |
| **Admin** | admin@myeasyhand.in |
| **Support** | info@myeasyhand.in |

## Packages

| Package | Port | Description |
|---|---|---|
| [myeasyhand-api](./myeasyhand-api) | 5050 | Backend API (Express + MongoDB + Redis) |
| [myeasyhand-web](./myeasyhand-web) | 3030 | Customer website (Next.js) |
| [myeasyhand-admin](./myeasyhand-admin) | 8080 | Admin panel (Next.js + MaterialPro) |
| [myeasyhand-customer-app](./myeasyhand-customer-app) | — | Customer mobile app (Expo) |
| [myeasyhand-employee-app](./myeasyhand-employee-app) | — | Employee mobile app (Expo) |

## Quick Start (Local)

```bash
# 1. API + database
cd myeasyhand-api
cp .env.example .env
docker compose up -d
npm install
npm run seed
npm run dev

# 2. Customer website
cd ../myeasyhand-web
npm install && npm run dev

# 3. Admin panel
cd ../myeasyhand-admin
npm install && npm run dev

# 4. Mobile apps
cd ../myeasyhand-customer-app
npm install && npx expo start
```

## Default Admin Login

- **Email:** admin@myeasyhand.in
- **Password:** Admin@123456 (from `.env` seed)

## Documentation

- [Platform Architecture](./doc/architecture/PLATFORM_ARCHITECTURE.md)
- [API Endpoints](./doc/api/API_ENDPOINTS.md)
- [Database Schema](./doc/database/DATABASE_SCHEMA.md)
- [VPS Deployment Guide](./doc/deployment/VPS_DEPLOYMENT_GUIDE.md)

## License

MIT — MyEasyHand © 2026
