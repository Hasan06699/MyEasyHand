import Link from 'next/link';
import { Box } from '@mui/material';
import { LOGO_SIZES, LogoSize, MyEasyHandLogoVariant } from './brand';

export interface MyEasyHandLogoProps {
  /** `gradient` — light backgrounds; `onDark` — navy header / sidebar */
  variant?: MyEasyHandLogoVariant;
  size?: LogoSize;
  /** Icon only (favicon-sized slots, collapsed sidebar) */
  iconOnly?: boolean;
  href?: string;
  /** Disable link wrapper (e.g. auth splash) */
  disableLink?: boolean;
}

const LOGO_FILES: Record<MyEasyHandLogoVariant, string> = {
  gradient: '/images/logos/logo-standard.svg',
  onDark: '/images/logos/logo-dark.svg',
  login: '/images/logos/login-logo.svg',
  white: '/images/logos/logo-white.svg',
};

const ICON_FILE = '/images/logos/icon.svg';

const HEIGHTS: Record<LogoSize, { full: number; icon: number }> = {
  sm: { full: 28, icon: 28 },
  md: { full: 36, icon: 36 },
  lg: { full: 56, icon: 44 },
};

export function MyEasyHandLogo({
  variant = 'gradient',
  size = 'md',
  iconOnly = false,
  href = '/',
  disableLink = false,
}: MyEasyHandLogoProps) {
  const dims = LOGO_SIZES[size];
  const heights = HEIGHTS[size];
  const src = iconOnly ? ICON_FILE : LOGO_FILES[variant];
  const height = iconOnly ? heights.icon : heights.full;

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: iconOnly ? 0 : `${dims.gap}px`,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={src}
        alt="MyEasyHand"
        sx={{
          height,
          width: 'auto',
          display: 'block',
          maxWidth: iconOnly ? height : 280,
        }}
      />
    </Box>
  );

  if (disableLink) {
    return content;
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
      {content}
    </Link>
  );
}
