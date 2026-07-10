const APP_SCHEME = 'myeasyhand';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://myeasyhand.in';

export function appDeepLink(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${APP_SCHEME}://${normalized}`;
}

export function webDeepLink(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL.replace(/\/$/, '')}${normalized}`;
}

export const DEEP_LINK_PATHS = {
  service: (id: string) => `/service/${id}`,
  category: (slug: string) => `/category/${slug}`,
  promotion: (id: string) => `/promotion/${id}`,
  booking: (id: string) => `/booking/${id}`,
  resetPassword: (email: string, code?: string) =>
    code
      ? `/(auth)/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
      : `/(auth)/reset-password?email=${encodeURIComponent(email)}`,
} as const;
