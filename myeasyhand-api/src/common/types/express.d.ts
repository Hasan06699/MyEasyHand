import { Request } from 'express';

export type RoleSlug = 'super_admin' | 'business_owner' | 'employee' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleSlug[];
  permissions: string[];
  businessId?: string;
  sessionId: string;
}

export interface RequestContext {
  user: AuthUser;
  businessId?: string;
  isSuperAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      ctx?: RequestContext;
    }
  }
}

export {};
