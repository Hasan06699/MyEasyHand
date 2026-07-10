import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../common/errors/AppError';
import { AuthUser, RoleSlug } from '../common/types/express';
import { User } from '../database/models/user.model';
import { Role } from '../database/models/role.model';

interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: RoleSlug[];
  permissions: string[];
  businessId?: string;
  sessionId: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;

    const user = await User.findOne({ _id: payload.sub, isDeleted: false });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or inactive');
    }

    const roleDocs = await Role.find({ slug: { $in: user.roleSlugs } });
    const permissions = new Set<string>();
    roleDocs.forEach((r) => r.permissions.forEach((p) => permissions.add(p)));

    req.user = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roleSlugs,
      permissions: Array.from(permissions),
      businessId: user.businessId?.toString(),
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  authenticate(req, res, next).catch(next);
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      businessId: user.businessId,
      sessionId: user.sessionId,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry } as jwt.SignOptions,
  );
}

export function signRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sessionId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as jwt.SignOptions);
}
