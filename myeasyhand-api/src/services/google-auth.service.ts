import { config } from '../config';
import { UnauthorizedError } from '../common/errors/AppError';

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified?: string | boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
  aud: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const payload = (await res.json()) as GoogleTokenPayload & { error?: string };
  if (payload.error) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const allowed = config.google.clientIds;
  if (allowed.length > 0 && !allowed.includes(payload.aud)) {
    throw new UnauthorizedError('Google token audience mismatch');
  }

  if (!payload.email) {
    throw new UnauthorizedError('Google account has no email');
  }

  return payload;
}
