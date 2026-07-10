'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromotionBanner } from '@/types';
import { isBannerClickable, openBannerLink, textPositionClasses } from '@/lib/bannerUtils';
import { BRAND } from '@/lib/brand';
import { CopyCouponButton } from '@/components/promotions/CopyCouponButton';
import { getMediaUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

function BannerImage({ banner }: { banner: PromotionBanner }) {
  const webSrc = banner.imageUrl;
  const mobileSrc = banner.mobileImageUrl || banner.imageUrl;

  if (!webSrc && !mobileSrc) return null;

  if (webSrc && mobileSrc && webSrc !== mobileSrc) {
    return (
      <>
        <Image
          src={getMediaUrl(webSrc)}
          alt={banner.title}
          fill
          className="hidden object-cover md:block"
          priority
          sizes="100vw"
        />
        <Image
          src={getMediaUrl(mobileSrc)}
          alt={banner.title}
          fill
          className="object-cover md:hidden"
          priority
          sizes="100vw"
        />
      </>
    );
  }

  const src = webSrc || mobileSrc;
  if (!src) return null;

  return (
    <Image
      src={getMediaUrl(src)}
      alt={banner.title}
      fill
      className="object-cover"
      priority
      sizes="100vw"
    />
  );
}

function BannerPreview({ banner, onClick }: { banner: PromotionBanner; onClick?: () => void }) {
  const hasImage = !!(banner.imageUrl || banner.mobileImageUrl);
  const imageOnly = banner.showImageOnly ?? false;
  const position = textPositionClasses(banner.textPosition ?? 'center-left');
  const clickable = isBannerClickable(banner) && banner.bannerType !== 'coupon';

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'relative min-h-[320px] overflow-hidden rounded-2xl md:min-h-[420px]',
        clickable && 'cursor-pointer transition-opacity hover:opacity-95',
      )}
      style={{ backgroundColor: banner.backgroundColor || BRAND.navy }}
    >
      {hasImage && <BannerImage banner={banner} />}

      {!imageOnly && hasImage && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/45" />
      )}

      {!imageOnly && (
      <div
        className={`relative flex min-h-[320px] p-6 md:min-h-[420px] md:p-10 ${position.container}`}
      >
        <div className={`max-w-xl md:max-w-2xl ${position.text}`}>
          <h2
            className="text-2xl font-bold md:text-4xl"
            style={{ color: banner.textColor || '#fff' }}
          >
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-3 text-base text-white/90 md:text-lg">{banner.subtitle}</p>
          )}
          {banner.bannerType === 'coupon' && banner.couponId?.code ? (
            <div className="pointer-events-auto mt-6">
              <CopyCouponButton code={banner.couponId.code} />
            </div>
          ) : (
            banner.couponId?.code && (
              <p className="mt-2 inline-block rounded-lg bg-white/20 px-3 py-1 text-sm font-medium text-white">
                Use code: {banner.couponId.code}
              </p>
            )
          )}
          {clickable && banner.bannerType !== 'coupon' && (
            <p className="mt-4 text-sm font-medium text-white/80">
              {banner.bannerType === 'link' ? 'Tap to open' : 'Tap to view'}
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export function BannerCarousel({ banners }: { banners: PromotionBanner[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  const handleBannerClick = (banner: PromotionBanner) => {
    if (banner.bannerType === 'coupon') return;

    if (banner.bannerType === 'services' || banner.bannerType === 'html') {
      router.push(`/promotions/${banner._id}`);
      return;
    }
    openBannerLink(banner);
  };

  if (!banners.length) {
    return (
      <div
        className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl px-6 py-16 text-center text-white md:min-h-[420px]"
        style={{ background: `linear-gradient(135deg, ${BRAND.headerBg} 0%, ${BRAND.teal} 100%)` }}
      >
        <div>
          <h1 className="text-3xl font-bold md:text-5xl">Book Trusted Services with MyEasyHand</h1>
          <p className="mt-4 text-lg text-white/90">
            Home cleaning, repairs, and more — schedule in minutes.
          </p>
        </div>
      </div>
    );
  }

  const banner = banners[index];

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BannerPreview banner={banner} onClick={() => handleBannerClick(banner)} />
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
