import { BRAND, MyEasyHandLogoVariant } from './brand';

interface MyEasyHandLogoIconProps {
  size?: number;
  variant?: MyEasyHandLogoVariant;
}

/**
 * Compact brand mark — house + tools silhouette using logo colors.
 * Prefer PNG icon for full lockup; this SVG is for collapsed sidebar slots.
 */
export function MyEasyHandLogoIcon({ size = 36, variant = 'gradient' }: MyEasyHandLogoIconProps) {
  const onDark = variant === 'onDark' || variant === 'white';
  const stroke = onDark ? BRAND.white : BRAND.blueDark;
  const accent = BRAND.orange;
  const fill = BRAND.blue;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Hand outline */}
      <path
        d="M24 6C18 6 14 12 14 18V28C14 34 18 40 24 42C30 40 34 34 34 28V18C34 12 30 6 24 6Z"
        stroke={stroke}
        strokeWidth="2.5"
        fill="none"
      />
      {/* House */}
      <path d="M18 26L24 20L30 26V34H18V26Z" fill={fill} />
      <rect x="21.5" y="27" width="5" height="5" rx="0.5" fill={onDark ? BRAND.blueDark : BRAND.white} />
      {/* Wrench accent */}
      <path d="M12 22L16 26" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      {/* Spray accent */}
      <circle cx="34" cy="24" r="2.5" fill={accent} />
    </svg>
  );
}
