import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../application/audit-log.service';
import { sendPaginated } from '../../../common/utils/response';

export class AuditLogController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const { items, meta } = await AuditLogService.list(req, page, limit);
      sendPaginated(res, items, meta);
    } catch (e) {
      next(e);
    }
  }
}
