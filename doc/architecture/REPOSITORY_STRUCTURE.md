# Repository Folder Structures

## 1. myeasyhand-api

```
myeasyhand-api/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-development.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── nginx/
│   └── api.conf
├── scripts/
│   ├── seed.sh
│   └── migrate.sh
├── src/
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   ├── swagger.ts
│   │   └── onesignal.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── presentation/    # routes, controllers
│   │   │   ├── application/     # auth service, token service
│   │   │   ├── domain/          # user entity, session rules
│   │   │   └── infrastructure/  # user repo, session store
│   │   ├── users/
│   │   ├── businesses/
│   │   ├── services/
│   │   ├── employees/
│   │   ├── customers/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── reviews/
│   │   └── master/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── sanitize.middleware.ts
│   │   └── auditLog.middleware.ts
│   ├── common/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── errors/
│   │   └── decorators/
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── otp.service.ts
│   │   ├── fileUpload.service.ts
│   │   └── onesignal.service.ts
│   ├── repositories/
│   ├── controllers/
│   ├── routes/
│   │   └── index.ts
│   ├── validators/
│   ├── helpers/
│   ├── jobs/
│   │   ├── bookingReminder.job.ts
│   │   └── subscriptionRenewal.job.ts
│   ├── queues/
│   │   ├── notification.queue.ts
│   │   └── email.queue.ts
│   ├── websocket/
│   │   ├── index.ts
│   │   └── booking.socket.ts
│   ├── notifications/
│   │   ├── templates/
│   │   └── handlers/
│   ├── storage/
│   │   ├── local.storage.ts
│   │   └── s3.storage.ts
│   ├── database/
│   │   ├── models/              # Mongoose models (see DATABASE_SCHEMA.md)
│   │   ├── migrations/
│   │   └── seeders/
│   ├── docs/
│   │   └── swagger.yaml
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .editorconfig
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── package.json
├── tsconfig.json
└── README.md
```

## 2. myeasyhand-web

```
myeasyhand-web/
├── .github/workflows/
├── nginx/
│   └── web.conf
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── verify-otp/
│   │   ├── (marketing)/         # Landing, about, pricing
│   │   ├── (customer)/
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   ├── profile/
│   │   │   └── services/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                  # ShadCN components
│   │   ├── layout/
│   │   ├── booking/
│   │   └── shared/
│   ├── hooks/
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── booking.store.ts
│   ├── services/api/
│   ├── types/
│   └── constants/
├── components.json              # ShadCN config
├── tailwind.config.ts
├── next.config.ts
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 3. myeasyhand-admin

```
myeasyhand-admin/
├── .github/workflows/
├── nginx/
│   └── admin.conf
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (DashboardLayout)/   # MaterialPro layout
│   │   │   ├── dashboard/
│   │   │   ├── businesses/
│   │   │   ├── services/
│   │   │   ├── employees/
│   │   │   ├── customers/
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   ├── settings/
│   │   │   ├── reports/
│   │   │   ├── layout/
│   │   │   └── layout.tsx
│   │   ├── context/
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── stores/
│   ├── services/api/
│   └── types/
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 4. myeasyhand-customer-app

```
myeasyhand-customer-app/
├── .github/workflows/
├── assets/
│   ├── images/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── verify-otp.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx        # Home
│   │   │   ├── services.tsx
│   │   │   ├── bookings.tsx
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── booking/
│   ├── features/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── services/
│   │   └── profile/
│   ├── hooks/
│   ├── lib/
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── auth.slice.ts
│   │       └── booking.slice.ts
│   ├── services/api/
│   ├── types/
│   └── constants/
├── app.json
├── eas.json
├── Dockerfile
└── README.md
```

## 5. myeasyhand-employee-app

```
myeasyhand-employee-app/
├── .github/workflows/
├── assets/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx        # Dashboard
│   │   │   ├── assignments.tsx
│   │   │   ├── schedule.tsx
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── components/ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── assignments/
│   │   ├── schedule/
│   │   └── profile/
│   ├── store/slices/
│   ├── services/api/
│   └── types/
├── app.json
├── eas.json
└── README.md
```
