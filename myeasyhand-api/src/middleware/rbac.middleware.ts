import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors/AppError';
import { RoleSlug } from '../common/types/express';

export function authorize(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    const roles = req.user.roles ?? [];
    const userPermissions = req.user.permissions ?? [];

    if (roles.includes('super_admin')) {
      next();
      return;
    }

    const hasPermission = permissions.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}

export function authorizeRoles(...roles: RoleSlug[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    const userRoles = req.user.roles ?? [];

    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole && !userRoles.includes('super_admin')) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }

    next();
  };
}
