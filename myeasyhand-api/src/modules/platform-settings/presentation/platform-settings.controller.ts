import { Request, Response, NextFunction } from 'express';
import { PlatformSettingsService } from '../application/platform-settings.service';
import { sendSuccess } from '../../../common/utils/response';

export class PlatformSettingsController {
  static async getPublic(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await PlatformSettingsService.getPublicAuthSettings();
      sendSuccess(res, settings);
    } catch (e) {
      next(e);
    }
  }

  static async getAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await PlatformSettingsService.getOrCreate();
      sendSuccess(res, doc.auth);
    } catch (e) {
      next(e);
    }
  }

  static async updateAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = await PlatformSettingsService.updateAuthSettings(req.body, req.user!.id);
      sendSuccess(res, auth, 'Platform settings updated');
    } catch (e) {
      next(e);
    }
  }
}
