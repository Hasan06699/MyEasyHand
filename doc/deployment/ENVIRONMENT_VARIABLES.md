# Environment Variables — MyEasyHand Platform

## myeasyhand-api

```env
# Application
NODE_ENV=development
PORT=5050
API_VERSION=v1
APP_NAME=MyEasyHand API
APP_URL=https://api.myeasyhand.in

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/myeasyhand
MONGODB_DB_NAME=myeasyhand

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myeasyhandservice@gmail.com
SMTP_PASS=
SMTP_FROM=info@myeasyhand.in

# SMS (optional)
SMS_PROVIDER=
SMS_API_KEY=

# OneSignal
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,application/pdf
STORAGE_TYPE=local
STORAGE_PATH=./uploads
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=https://myeasyhand.in,https://admin.myeasyhand.in,http://localhost:3030,http://localhost:8080

# Logging
LOG_LEVEL=info
```

## myeasyhand-web

```env
NEXT_PUBLIC_APP_NAME=MyEasyHand
NEXT_PUBLIC_APP_URL=https://myeasyhand.in
NEXT_PUBLIC_API_URL=https://api.myeasyhand.in/api/v1
NEXT_PUBLIC_ONESIGNAL_APP_ID=
PORT=3030
```

## myeasyhand-admin

```env
NEXT_PUBLIC_APP_NAME=MyEasyHand Admin
NEXT_PUBLIC_APP_URL=https://admin.myeasyhand.in
NEXT_PUBLIC_API_URL=https://api.myeasyhand.in/api/v1
PORT=8080
```

## myeasyhand-customer-app

```env
EXPO_PUBLIC_APP_NAME=MyEasyHand
EXPO_PUBLIC_API_URL=https://api.myeasyhand.in/api/v1
EXPO_PUBLIC_ONESIGNAL_APP_ID=
```

## myeasyhand-employee-app

```env
EXPO_PUBLIC_APP_NAME=MyEasyHand Employee
EXPO_PUBLIC_API_URL=https://api.myeasyhand.in/api/v1
EXPO_PUBLIC_ONESIGNAL_APP_ID=
```

## VPS / Infrastructure

```env
# Domain
DOMAIN=myeasyhand.in
ADMIN_DOMAIN=admin.myeasyhand.in
API_DOMAIN=api.myeasyhand.in

# SSL (Let's Encrypt via Certbot)
CERTBOT_EMAIL=info@myeasyhand.in

# PM2
PM2_INSTANCES=2
```
