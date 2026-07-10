/** MyEasyHand brand tokens — keep in sync with brand guidelines */
export const BRAND = {
  navy: '#122B63',
  teal: '#3FAFB0',
  tealDark: '#2E8F93',
  white: '#FFFFFF',
  lightBg: '#F5F7FA',
  headerBg: '#003c40',
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://myeasyhand.in',
} as const;

export type MyEasyHandLogoVariant = 'gradient' | 'onDark' | 'login' | 'white';

export const LOGO_SIZES = {
  sm: { icon: 28, wordmark: 18, gap: 8 },
  md: { icon: 36, wordmark: 22, gap: 10 },
  lg: { icon: 44, wordmark: 26, gap: 12 },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
