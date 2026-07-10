/** MyEasyHand brand tokens — colors from official logo */
export const BRAND = {
  name: 'MyEasyHand',
  tagline: 'Home Repairs & Cleaning Services',
  blue: '#1E88E5',
  blueLight: '#00AEEF',
  blueDark: '#1565C0',
  orange: '#FF8F00',
  orangeLight: '#F9A01B',
  orangeDark: '#E65100',
  white: '#FFFFFF',
  lightBg: '#F0F7FC',
  surface: '#FFFFFF',
  /** Customer web chrome — light header (distinct from admin orange) */
  headerBg: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://myeasyhand.in',
} as const;

export type MyEasyHandLogoVariant = 'gradient' | 'onDark' | 'white' | 'icon';

export const LOGO_SIZES = {
  sm: { height: 28, maxWidth: 160 },
  md: { height: 36, maxWidth: 200 },
  lg: { height: 48, maxWidth: 260 },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
