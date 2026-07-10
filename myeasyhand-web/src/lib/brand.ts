/** MyEasyHand brand tokens — keep in sync with admin brand guidelines */
export const BRAND = {
  navy: '#122B63',
  teal: '#3FAFB0',
  tealDark: '#2E8F93',
  white: '#FFFFFF',
  lightBg: '#F5F7FA',
  headerBg: '#003c40',
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://myeasyhand.in',
} as const;

export type MyEasyHandLogoVariant = 'gradient' | 'onDark' | 'white';

export const LOGO_SIZES = {
  sm: { height: 28, maxWidth: 160 },
  md: { height: 36, maxWidth: 200 },
  lg: { height: 44, maxWidth: 240 },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
