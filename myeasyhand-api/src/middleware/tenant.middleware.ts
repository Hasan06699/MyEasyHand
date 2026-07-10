import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../common/types/express';

export function tenantContext(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next();
    return;
  }

  const isSuperAdmin = req.user.roles.includes('super_admin');

  req.ctx = {
    user: req.user,
    businessId: isSuperAdmin ? req.user.businessId : req.user.businessId,
    isSuperAdmin,
  };

  next();
}

export function getTenantFilter(req: Request): Record<string, unknown> {
  if (!req.ctx) return {};
  if (req.ctx.isSuperAdmin) return {};
  if (req.ctx.businessId) return { businessId: req.ctx.businessId };
  return {};
}
