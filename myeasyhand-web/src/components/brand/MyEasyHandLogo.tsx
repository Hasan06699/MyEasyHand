import Image from 'next/image';
import Link from 'next/link';
import { BRAND, LOGO_SIZES, LogoSize, MyEasyHandLogoVariant } from '@/lib/brand';

const LOGO_FILES: Record<MyEasyHandLogoVariant, string> = {
  gradient: '/images/logos/logo-standard.svg',
  onDark: '/images/logos/logo-dark.svg',
  white: '/images/logos/logo-white.svg',
};

export interface MyEasyHandLogoProps {
  variant?: MyEasyHandLogoVariant;
  size?: LogoSize;
  href?: string;
  disableLink?: boolean;
  className?: string;
}

export function MyEasyHandLogo({
  variant = 'gradient',
  size = 'md',
  href = '/',
  disableLink = false,
  className,
}: MyEasyHandLogoProps) {
  const dims = LOGO_SIZES[size];
  const src = LOGO_FILES[variant];

  const content = (
    <Image
      src={src}
      alt="MyEasyHand"
      width={dims.maxWidth}
      height={dims.height}
      priority={variant === 'onDark'}
      className={className}
      style={{ height: dims.height, width: 'auto', maxWidth: dims.maxWidth }}
    />
  );

  if (disableLink) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}

export { BRAND };
