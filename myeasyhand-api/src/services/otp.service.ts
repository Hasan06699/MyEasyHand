import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getRedis } from '../config/redis';
import { config } from '../config';

const OTP_PREFIX = 'otp:';

export class OtpService {
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async store(key: string, code: string): Promise<void> {
    const redis = getRedis();
    const ttl = config.otp.expiryMinutes * 60;
    await redis.setex(`${OTP_PREFIX}${key}`, ttl, code);
    await redis.setex(`${OTP_PREFIX}${key}:attempts`, ttl, '0');
  }

  static async verify(key: string, code: string): Promise<boolean> {
    const redis = getRedis();
    const stored = await redis.get(`${OTP_PREFIX}${key}`);
    if (!stored) return false;

    const attemptsKey = `${OTP_PREFIX}${key}:attempts`;
    const attempts = parseInt((await redis.get(attemptsKey)) || '0', 10);
    if (attempts >= config.otp.maxAttempts) return false;

    await redis.incr(attemptsKey);

    if (stored !== code) return false;

    await redis.del(`${OTP_PREFIX}${key}`, attemptsKey);
    return true;
  }
}

export class TokenService {
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
