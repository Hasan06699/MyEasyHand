import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { RoleSlug } from '../common/types/express';
import { User } from '../database/models/user.model';
import { AuthService } from '../modules/auth/application/auth.service';

const SWAGGER_COOKIE = 'swagger_token';
const ADMIN_ROLES: RoleSlug[] = ['super_admin', 'business_owner'];

interface AccessTokenPayload {
  sub: string;
  roles?: RoleSlug[];
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  admin_required: 'Only admin accounts can access API documentation.',
  session_expired: 'Session expired. Please sign in again.',
};

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${SWAGGER_COOKIE}=([^;]+)`));
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  if (typeof req.query.token === 'string' && req.query.token.length > 0) {
    return req.query.token;
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setSwaggerCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SWAGGER_COOKIE}=${encodeURIComponent(token)}; Path=/api; SameSite=Lax; Max-Age=900`,
  );
}

function clearSwaggerCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SWAGGER_COOKIE}=; Path=/api; SameSite=Lax; Max-Age=0`,
  );
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
    const user = await User.findOne({ _id: payload.sub, isDeleted: false }).select('roleSlugs status');
    if (!user || user.status !== 'active') {
      return false;
    }

    return user.roleSlugs.some((role) => ADMIN_ROLES.includes(role));
  } catch {
    return false;
  }
}

export function getSwaggerLoginHtml(error?: string): string {
  const errorBlock = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : '<div class="error" id="error" hidden></div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyEasyHand API Docs — Admin Login</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #122B63 0%, #1a3d8f 100%);
      color: #1f2937;
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    }
    h1 { margin: 0 0 8px; font-size: 22px; color: #122B63; }
    p { margin: 0 0 24px; color: #6b7280; font-size: 14px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      background: #FB8500;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error {
      color: #dc2626;
      font-size: 13px;
      margin-top: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>MyEasyHand API Docs</h1>
    <p>Admin login required to view API documentation.</p>
    <form method="POST" action="/api/docs/login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required autocomplete="username" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required autocomplete="current-password" />
      <button type="submit">Sign in</button>
      ${errorBlock}
    </form>
  </div>
</body>
</html>`;
}

export async function handleSwaggerLogin(req: Request, res: Response): Promise<void> {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.redirect('/api/docs?error=invalid_credentials');
    return;
  }

  try {
    const result = await AuthService.login(email, password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    const roles = result.user.roleSlugs ?? [];
    const isAdmin = roles.some((role) => ADMIN_ROLES.includes(role));
    if (!isAdmin) {
      res.redirect('/api/docs?error=admin_required');
      return;
    }

    setSwaggerCookie(res, result.accessToken);
    res.redirect('/api/docs');
  } catch {
    res.redirect('/api/docs?error=invalid_credentials');
  }
}

export async function protectSwaggerDocs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.query.email || req.query.password) {
    res.redirect('/api/docs');
    return;
  }

  const token = extractToken(req);

  if (!token) {
    if (req.method === 'GET' && (req.path === '/' || req.path === '')) {
      const errorKey = typeof req.query.error === 'string' ? req.query.error : undefined;
      const error = errorKey ? ERROR_MESSAGES[errorKey] ?? 'Unable to sign in.' : undefined;
      res.type('html').send(getSwaggerLoginHtml(error));
      return;
    }
    res.status(401).json({ success: false, message: 'Admin authentication required' });
    return;
  }

  const isAdmin = await verifyAdminToken(token);
  if (!isAdmin) {
    clearSwaggerCookie(res);
    if (req.method === 'GET' && (req.path === '/' || req.path === '')) {
      res.redirect('/api/docs?error=session_expired');
      return;
    }
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
}

export async function protectSwaggerJson(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Admin authentication required' });
    return;
  }

  const isAdmin = await verifyAdminToken(token);
  if (!isAdmin) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
}