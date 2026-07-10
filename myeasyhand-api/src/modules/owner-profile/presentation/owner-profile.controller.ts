import { Request, Response, NextFunction } from 'express';
import { OwnerProfileService } from '../application/owner-profile.service';
import { sendSuccess } from '../../../common/utils/response';

export class OwnerProfileController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.getOverview(req);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async updatePersonal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updatePersonal(req, req.body);
      sendSuccess(res, data, 'Personal information updated');
    } catch (e) {
      next(e);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updateAddress(req, req.body);
      sendSuccess(res, data, 'Address updated');
    } catch (e) {
      next(e);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updatePreferences(req, req.body);
      sendSuccess(res, data, 'Preferences updated');
    } catch (e) {
      next(e);
    }
  }

  static async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updateAccountSettings(req, req.body);
      sendSuccess(res, data, 'Account settings updated');
    } catch (e) {
      next(e);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OwnerProfileService.changePassword(
        req,
        req.body.currentPassword,
        req.body.newPassword,
      );
      sendSuccess(res, result, 'Password changed');
    } catch (e) {
      next(e);
    }
  }

  static async getLoginActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.getLoginActivity(req);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async updateBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updateBusiness(req, req.body);
      sendSuccess(res, data, 'Business information updated');
    } catch (e) {
      next(e);
    }
  }

  static async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.getPayment(req);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async updatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.updatePayment(req, req.body);
      sendSuccess(res, data, 'Payment information updated');
    } catch (e) {
      next(e);
    }
  }

  static async getEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OwnerProfileService.getEarnings(req);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  }
}
