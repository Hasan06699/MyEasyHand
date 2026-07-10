import type { PromotionBanner, ServiceRow } from '@/types';
import { normalizeTextPosition, resolveBannerType } from '@/lib/bannerUtils';

export interface ApiPromotionBanner {
  _id: string;
  name?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageWeb?: string;
  bannerImageMobile?: string;
  bannerLayoutType?: 'standard' | 'offer' | 'html_landing';
  bannerType?: 'services' | 'link' | 'html' | 'coupon';
  showImageOnly?: boolean;
  textPosition?: string;
  linkUrl?: string;
  htmlContent?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  redirectionType?: string;
  redirectionUrl?: string;
  redirectionTargetId?: string;
  couponId?: {
    code?: string;
    name?: string;
    description?: string;
    discountPercentage?: number;
    discountAmount?: number;
  };
  backgroundColor?: string;
  textColor?: string;
  services?: ServiceRow['services'];
}

export interface ApiServiceRow {
  _id: string;
  rowName?: string;
  rowTitle?: string;
  rowSubtitle?: string;
  title?: string;
  subtitle?: string;
  services?: ServiceRow['services'];
  serviceSourceType?: string;
  categoryId?: { _id?: string; name?: string; slug?: string } | string;
}

export function normalizePromotionBanner(raw: ApiPromotionBanner): PromotionBanner | null {
  const imageUrl = raw.bannerImageMobile || raw.bannerImageWeb;
  const bannerType = resolveBannerType({
    bannerType: raw.bannerType,
    bannerLayoutType: raw.bannerLayoutType,
    linkUrl: raw.linkUrl || raw.ctaButtonLink || raw.redirectionUrl,
    couponId: raw.couponId,
  });

  if (!imageUrl && bannerType !== 'html' && bannerType !== 'coupon' && raw.bannerLayoutType !== 'html_landing') {
    return null;
  }

  let linkUrl = raw.linkUrl || raw.ctaButtonLink || raw.redirectionUrl;
  if (!linkUrl && raw.redirectionType === 'service' && raw.redirectionTargetId) {
    linkUrl = `/service/${raw.redirectionTargetId}`;
  }
  if (!linkUrl && raw.redirectionType === 'category' && raw.redirectionTargetId) {
    linkUrl = `/category/${raw.redirectionTargetId}`;
  }

  const coupon = raw.couponId;
  const couponId = coupon
    ? {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        displayValue:
          coupon.discountPercentage != null
            ? `${coupon.discountPercentage}% off`
            : coupon.discountAmount != null
              ? `₹${coupon.discountAmount} off`
              : undefined,
      }
    : undefined;

  return {
    _id: raw._id,
    title: raw.bannerTitle || raw.name || 'Promotion',
    subtitle: raw.bannerSubtitle,
    imageUrl: raw.bannerImageWeb || imageUrl,
    mobileImageUrl: raw.bannerImageMobile || raw.bannerImageWeb,
    linkUrl,
    htmlContent: raw.htmlContent,
    couponId,
    backgroundColor: raw.backgroundColor,
    textColor: raw.textColor,
    bannerLayoutType: raw.bannerLayoutType,
    bannerType,
    showImageOnly: raw.showImageOnly ?? false,
    textPosition: normalizeTextPosition(raw.textPosition),
    ctaButtonText: raw.ctaButtonText,
    services: raw.services ?? [],
  };
}

export function normalizeServiceRow(raw: ApiServiceRow): ServiceRow {
  return {
    _id: raw._id,
    title: raw.rowTitle || raw.title || raw.rowName || 'Services',
    subtitle: raw.rowSubtitle || raw.subtitle,
    services: raw.services ?? [],
    serviceSourceType: raw.serviceSourceType,
    categoryId: raw.categoryId,
  };
}
