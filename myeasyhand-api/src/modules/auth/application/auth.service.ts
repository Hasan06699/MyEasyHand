import { Types } from 'mongoose';
import { User, IUser } from '../../../database/models/user.model';
import { Role } from '../../../database/models/role.model';
import { Session } from '../../../database/models/session.model';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../common/errors/AppError';
import { AuthUser, RoleSlug } from '../../../common/types/express';
import { OtpService, TokenService } from '../../../services/otp.service';
import { EmailService } from '../../../services/email.service';
import { signAccessToken, signRefreshToken } from '../../../middleware/auth.middleware';
import { config } from '../../../config';
import { PlatformSettingsService } from '../../platform-settings/application/platform-settings.service';
import { verifyGoogleIdToken } from '../../../services/google-auth.service';
import { logger } from '../../../common/utils/logger';

const RESET_PREFIX = 'reset:';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: RoleSlug;
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new ConflictError('Email already registered');

    const settings = await PlatformSettingsService.getPublicAuthSettings();
    const passwordHash = await TokenService.hashPassword(data.password);
    const roleSlugs: RoleSlug[] = [data.role || 'customer'];

    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roleSlugs,
      isEmailVerified: !settings.otpVerificationEnabled,
    });

    if (settings.otpVerificationEnabled) {
      const otp = OtpService.generateCode();
      await OtpService.store(`verify:${user._id}`, otp);
      await EmailService.sendOtpEmail(user.email, 'Verify your MyEasyHand account', otp, 'verification');
      logger.info(`OTP for ${user.email}: ${otp}`);
      return {
        user: this.sanitizeUser(user),
        requiresOtp: true,
      };
    }

    const sessionResult = await this.issueAuthResponse(user);
    return {
      ...sessionResult,
      requiresOtp: false,
    };
  }

  static async login(email: string, password: string, deviceInfo?: { userAgent?: string; ip?: string }) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (user.status !== 'active') throw new UnauthorizedError('Account is not active');

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses Google sign-in. Please continue with Google.');
    }

    const valid = await TokenService.comparePassword(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    return this.issueAuthResponse(user, deviceInfo);
  }

  static async googleLogin(idToken: string, deviceInfo?: { userAgent?: string; ip?: string }) {
    const settings = await PlatformSettingsService.getPublicAuthSettings();
    if (!settings.googleLoginEnabled) {
      throw new ValidationError('Google sign-in is currently disabled');
    }

    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let user = await User.findOne({ googleId, isDeleted: false });
    if (!user) {
      user = await User.findOne({ email, isDeleted: false });
      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          throw new ConflictError('Email is linked to a different Google account');
        }
        user.googleId = googleId;
        user.isEmailVerified = true;
        if (payload.picture && !user.avatar) user.avatar = payload.picture;
        await user.save();
      }
    }

    if (!user) {
      const nameParts = (payload.name || email.split('@')[0]).split(' ');
      user = await User.create({
        email,
        googleId,
        firstName: payload.given_name || nameParts[0] || 'User',
        lastName: payload.family_name || nameParts.slice(1).join(' ') || '',
        avatar: payload.picture,
        roleSlugs: ['customer'],
        isEmailVerified: true,
      });
    }

    if (user.status !== 'active') throw new UnauthorizedError('Account is not active');

    return this.issueAuthResponse(user, deviceInfo);
  }

  static async refresh(refreshToken: string) {
    const jwt = await import('jsonwebtoken');
    let payload: { sub: string; sessionId: string };
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { sub: string; sessionId: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const session = await Session.findOne({
      _id: payload.sessionId,
      userId: payload.sub,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) throw new UnauthorizedError('Session expired');

    const tokenHash = TokenService.hashToken(refreshToken);
    if (session.refreshTokenHash !== tokenHash) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted || user.status !== 'active') {
      throw new UnauthorizedError('User not found');
    }

    const { roles, permissions } = await this.resolveRolesAndPermissions(user);

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      roles,
      permissions,
      businessId: user.businessId?.toString(),
      sessionId: session._id.toString(),
    };

    return {
      accessToken: signAccessToken(authUser),
      refreshToken,
    };
  }

  static async logout(sessionId: string): Promise<void> {
    await Session.updateOne({ _id: sessionId }, { isRevoked: true });
  }

  static async verifyOtp(userId: string, code: string, deviceInfo?: { userAgent?: string; ip?: string }) {
    const valid = await OtpService.verify(`verify:${userId}`, code);
    if (!valid) throw new ValidationError('Invalid or expired OTP');

    const user = await User.findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true });
    if (!user) throw new NotFoundError('User not found');

    return this.issueAuthResponse(user, deviceInfo);
  }

  static async resendOtp(userId: string) {
    const settings = await PlatformSettingsService.getPublicAuthSettings();
    if (!settings.otpVerificationEnabled) {
      return { message: 'OTP verification is disabled' };
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const otp = OtpService.generateCode();
    await OtpService.store(`verify:${userId}`, otp);
    await EmailService.sendOtpEmail(user.email, 'Your MyEasyHand verification code', otp, 'verification');
    logger.info(`Resent OTP for ${user.email}: ${otp}`);
    return { message: 'OTP sent' };
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) return { message: 'If account exists, reset instructions sent' };

    const otp = OtpService.generateCode();
    await OtpService.store(`${RESET_PREFIX}${user._id}`, otp);
    await EmailService.sendOtpEmail(user.email, 'Reset your MyEasyHand password', otp, 'password reset');
    logger.info(`Password reset OTP for ${email}: ${otp}`);
    return { message: 'If account exists, reset instructions sent' };
  }

  static async resetPassword(code: string, email: string, newPassword: string) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) throw new ValidationError('Invalid reset request');

    const valid = await OtpService.verify(`${RESET_PREFIX}${user._id}`, code);
    if (!valid) throw new ValidationError('Invalid or expired reset code');

    user.passwordHash = await TokenService.hashPassword(newPassword);
    await user.save();
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    return { message: 'Password reset successful' };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) throw new NotFoundError('User not found');
    const { roles, permissions } = await this.resolveRolesAndPermissions(user);
    return { ...this.sanitizeUser(user), roles, permissions };
  }

  static async updateMe(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string; avatar?: string },
  ) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) throw new NotFoundError('User not found');

    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.avatar !== undefined) user.avatar = data.avatar || undefined;

    await user.save();
    const { roles, permissions } = await this.resolveRolesAndPermissions(user);
    return { ...this.sanitizeUser(user), roles, permissions };
  }

  private static async issueAuthResponse(user: IUser, deviceInfo?: { userAgent?: string; ip?: string }) {
    const { roles, permissions } = await this.resolveRolesAndPermissions(user);
    const { session, refreshToken } = await this.createSession(user._id, deviceInfo);

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      roles,
      permissions,
      businessId: user.businessId?.toString(),
      sessionId: session._id.toString(),
    };

    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: this.sanitizeUser(user),
      accessToken: signAccessToken(authUser),
      refreshToken,
    };
  }

  private static async createSession(
    userId: Types.ObjectId,
    deviceInfo?: { userAgent?: string; ip?: string },
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      userId,
      refreshTokenHash: 'pending',
      deviceInfo,
      expiresAt,
    });

    const refreshToken = signRefreshToken(userId.toString(), session._id.toString());
    session.refreshTokenHash = TokenService.hashToken(refreshToken);
    await session.save();

    return { session, refreshToken };
  }

  static async resolveRolesAndPermissions(user: IUser) {
    const roleDocs = await Role.find({ slug: { $in: user.roleSlugs } });
    const permissions = new Set<string>();
    roleDocs.forEach((r) => r.permissions.forEach((p: string) => permissions.add(p)));
    return {
      roles: user.roleSlugs,
      permissions: Array.from(permissions),
    };
  }

  private static sanitizeUser(user: IUser) {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      roleSlugs: user.roleSlugs,
      businessId: user.businessId?.toString(),
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      hasGoogleLinked: !!user.googleId,
    };
  }
}
