import { Linking } from 'react-native';
import type { Href, router } from 'expo-router';

type Router = typeof router;
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

export function textPositionLayout(position: BannerTextPosition) {
  const map: Record<
    BannerTextPosition,
    { justifyContent: 'flex-start' | 'center' | 'flex-end'; alignItems: 'flex-start' | 'center' | 'flex-end'; textAlign: 'left' | 'center' | 'right' }
  > = {
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start', textAlign: 'left' },
    'top-center': { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'center' },
    'top-right': { justifyContent: 'flex-start', alignItems: 'flex-end', textAlign: 'right' },
    'center-left': { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' },
    center: { justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
    'center-right': { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right' },
    'bottom-left': { justifyContent: 'flex-end', alignItems: 'flex-start', textAlign: 'left' },
    'bottom-center': { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' },
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
    return `/promotion/${banner._id}`;
  }
  return null;
}

export function isBannerClickable(banner: PromotionBanner): boolean {
  return getBannerDestination(banner) !== null;
}

export function handleBannerPress(banner: PromotionBanner, router: Router) {
  if (banner.bannerType === 'coupon') return;

  if (banner.bannerType === 'services' || banner.bannerType === 'html') {
    router.push(`/promotion/${banner._id}` as Href);
    return;
  }

  const dest = getBannerDestination(banner);
  if (!dest) return;

  if (banner.bannerType === 'link') {
    if (dest.startsWith('http')) {
      void Linking.openURL(dest);
      return;
    }
    if (dest.startsWith('/service/') || dest.startsWith('/services/')) {
      const serviceId = dest.split('/').pop();
      if (serviceId) {
        router.push({ pathname: '/service/[id]', params: { id: serviceId } });
        return;
      }
    }
    if (dest.startsWith('/category/') || dest.startsWith('/categories/')) {
      const slug = dest.split('/').pop();
      if (slug) {
        router.push({ pathname: '/category/[slug]', params: { slug } });
        return;
      }
    }
    if (dest.startsWith('/promotion/')) {
      const promotionId = dest.split('/').pop();
      if (promotionId) {
        router.push(`/promotion/${promotionId}` as Href);
        return;
      }
    }
    void Linking.openURL(dest);
  }
}
