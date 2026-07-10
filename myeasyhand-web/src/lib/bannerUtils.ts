import type { BannerTextPosition, BannerType, PromotionBanner } from '@/types';

export function normalizeTextPosition(position?: string): BannerTextPosition {
  if (position === 'left') return 'center-left';
  if (position === 'right') return 'center-right';
  const valid: BannerTextPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
  if (position && valid.includes(position as BannerTextPosition)) {
    return position as BannerTextPosition;
  }
  return 'center-left';
}

export function textPositionClasses(position: BannerTextPosition) {
  const map: Record<BannerTextPosition, { container: string; text: string }> = {
    'top-left': { container: 'justify-start items-start', text: 'text-left' },
    'top-center': { container: 'justify-center items-start', text: 'text-center' },
    'top-right': { container: 'justify-end items-start', text: 'text-right' },
    'center-left': { container: 'justify-start items-center', text: 'text-left' },
    center: { container: 'justify-center items-center', text: 'text-center' },
    'center-right': { container: 'justify-end items-center', text: 'text-right' },
    'bottom-left': { container: 'justify-start items-end', text: 'text-left' },
    'bottom-center': { container: 'justify-center items-end', text: 'text-center' },
    'bottom-right': { container: 'justify-end items-end', text: 'text-right' },
  };
  return map[position];
}

export function resolveBannerType(banner: {
  bannerType?: BannerType;
  bannerLayoutType?: string;
  linkUrl?: string;
  couponId?: unknown;
}): BannerType {
  if (banner.bannerType) return banner.bannerType;
  if (banner.bannerLayoutType === 'html_landing') return 'html';
  if (banner.couponId) return 'coupon';
  if (banner.linkUrl) return 'link';
  return 'services';
}

export function getBannerDestination(banner: PromotionBanner): string | null {
  if (banner.bannerType === 'link') {
    return banner.linkUrl || null;
  }
  if (banner.bannerType === 'services' || banner.bannerType === 'html' || banner.bannerType === 'coupon') {
    return `/promotions/${banner._id}`;
  }
  return null;
}

export function isBannerClickable(banner: PromotionBanner): boolean {
  return getBannerDestination(banner) !== null;
}

export function openBannerLink(banner: PromotionBanner) {
  const dest = getBannerDestination(banner);
  if (!dest) return;

  if (banner.bannerType === 'link') {
    const url = dest.startsWith('http') ? dest : `${window.location.origin}${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.assign(dest);
}
