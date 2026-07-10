import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../application/auth.service';
import { DeviceService } from '../application/device.service';
import { sendCreated, sendSuccess } from '../../../common/utils/response';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      const message = result.requiresOtp
        ? 'Registration successful. Please verify OTP.'
        : 'Registration successful';
      sendCreated(res, result, message);
    } catch (e) {
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      sendSuccess(res, result, 'Login successful');
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.sessionId) {
        await AuthService.logout(req.user.sessionId);
      }
      sendSuccess(res, null, 'Logged out');
    } catch (e) {
      next(e);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.updateMe(req.user!.id, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (e) {
      next(e);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyOtp(req.body.userId, req.body.code, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      sendSuccess(res, result, 'Email verified');
    } catch (e) {
      next(e);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.googleLogin(req.body.idToken, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      sendSuccess(res, result, 'Login successful');
    } catch (e) {
      next(e);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resendOtp(req.body.userId);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(
        req.body.code,
        req.body.email,
        req.body.newPassword,
      );
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  /** Register push device — supports multiple devices per user (web + app). */
  static async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await DeviceService.registerDevice({
        userId: req.user!.id,
        platform: req.body.platform,
        onesignalSubscriptionId: req.body.onesignalSubscriptionId || undefined,
        deviceLabel: req.body.deviceLabel,
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, device, 'Device registered for notifications');
    } catch (e) {
      next(e);
    }
  }

  /** Unregister current device only — other devices stay active. */
  static async unregisterDevice(req: Request, res: Response, next: NextFunction) {
    try {
      await DeviceService.unregisterDevice(req.user!.id, req.body.onesignalSubscriptionId);
      sendSuccess(res, null, 'Device unregistered');
    } catch (e) {
      next(e);
    }
  }

  static async listDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const devices = await DeviceService.listActiveDevices(req.user!.id);
      sendSuccess(res, devices);
    } catch (e) {
      next(e);
    }
  }
}
