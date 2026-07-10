/** MyEasyHand Admin brand tokens — colors from official logo (orange-led UI) */
export const BRAND = {
  name: 'MyEasyHand',
  tagline: 'Home Repairs & Cleaning Services',
  /** MyEasy blue (logo) */
  blue: '#1E88E5',
  blueLight: '#00AEEF',
  blueDark: '#1565C0',
  /** Hand orange (logo) — primary for admin */
  orange: '#FF8F00',
  orangeLight: '#F9A01B',
  orangeDark: '#E65100',
  white: '#FFFFFF',
  lightBg: '#FFF8F0',
  /** Admin header — orange (distinct from customer web blue) */
  headerBg: '#E65100',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://myeasyhand.in',
} as const;

export type MyEasyHandLogoVariant = 'gradient' | 'onDark' | 'login' | 'white' | 'icon';

export const LOGO_SIZES = {
  sm: { icon: 28, wordmark: 18, gap: 8 },
  md: { icon: 36, wordmark: 22, gap: 10 },
  lg: { icon: 44, wordmark: 26, gap: 12 },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
