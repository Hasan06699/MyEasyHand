import Link from 'next/link';
import { Box } from '@mui/material';
import { BRAND, LOGO_SIZES, LogoSize, MyEasyHandLogoVariant } from './brand';

export interface MyEasyHandLogoProps {
  /** `gradient` — light backgrounds; `onDark` — orange header / sidebar */
  variant?: MyEasyHandLogoVariant;
  size?: LogoSize;
  /** Icon only (favicon-sized slots, collapsed sidebar) */
  iconOnly?: boolean;
  href?: string;
  /** Disable link wrapper (e.g. auth splash) */
  disableLink?: boolean;
}

const LOGO_FILES: Record<MyEasyHandLogoVariant, string> = {
  gradient: '/images/logos/logo-wordmark.png',
  onDark: '/images/logos/logo-wordmark.png',
  login: '/images/logos/icon.png',
  white: '/images/logos/logo-wordmark.png',
  icon: '/images/logos/icon.png',
};

const ICON_FILE = '/images/logos/icon.png';

const HEIGHTS: Record<LogoSize, { full: number; icon: number }> = {
  sm: { full: 28, icon: 28 },
  md: { full: 36, icon: 36 },
  lg: { full: 56, icon: 48 },
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
  const onDark = variant === 'onDark' || variant === 'white';

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: iconOnly ? 0 : `${dims.gap}px`,
        textDecoration: 'none',
        flexShrink: 0,
        bgcolor: onDark ? BRAND.white : 'transparent',
        borderRadius: onDark ? '10px' : 0,
        px: onDark ? 1.25 : 0,
        py: onDark ? 0.5 : 0,
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
