import { Request, Response, NextFunction } from 'express';
import { CityService } from '../application/city.service';
import { sendSuccess, sendCreated } from '../../../common/utils/response';

export class CityController {
  static async listPublic(_req: Request, res: Response, next: NextFunction) {
    try {
      const cities = await CityService.listPublic();
      sendSuccess(res, cities);
    } catch (err) {
      next(err);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const cities = await CityService.listAdmin(req.query.includeInactive === 'true');
      sendSuccess(res, cities);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await CityService.create(req, req.body);
      sendCreated(res, city, 'City created');
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await CityService.update(req, String(req.params.id), req.body);
      sendSuccess(res, city, 'City updated');
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CityService.remove(req, String(req.params.id));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
