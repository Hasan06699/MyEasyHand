import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5051', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  appName: process.env.APP_NAME || 'MyEasyHand API',
  appUrl: process.env.APP_URL || 'http://localhost:5051',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/myeasyhand',
    dbName: process.env.MONGODB_DB_NAME || 'myeasyhand',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production-32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production-32chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'info@myeasyhand.in',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3031,http://localhost:8081')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  onesignal: {
    appId: process.env.ONESIGNAL_APP_ID || '',
    restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    storagePath: process.env.STORAGE_PATH || './uploads',
  },
  nsfwModeration: {
    enabled: process.env.NSFW_MODERATION_ENABLED !== 'false',
    model: process.env.NSFW_MODEL || 'InceptionV3',
    pornThreshold: parseFloat(process.env.NSFW_PORN_THRESHOLD || '0.25'),
    hentaiThreshold: parseFloat(process.env.NSFW_HENTAI_THRESHOLD || '0.25'),
    sexyThreshold: parseFloat(process.env.NSFW_SEXY_THRESHOLD || '0.6'),
    combinedThreshold: parseFloat(process.env.NSFW_COMBINED_THRESHOLD || '0.35'),
    topClassThreshold: parseFloat(process.env.NSFW_TOP_CLASS_THRESHOLD || '0.2'),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  google: {
    clientIds: (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
};
