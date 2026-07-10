'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CopyCouponButton } from '@/components/promotions/CopyCouponButton';
import { promotionApi, serviceApi } from '@/lib/api';
import { normalizePromotionBanner, type ApiPromotionBanner } from '@/lib/promotions';

export function PromotionBannerPageClient({ id }: { id: string }) {
  const { data: banner, isLoading, isError } = useQuery({
    queryKey: ['banner', id],
    queryFn: async () => {
      const res = await promotionApi.activeBannerById(id, { platform: 'website' });
      return normalizePromotionBanner(res.data.data as ApiPromotionBanner);
    },
  });

  const showTopBooked = banner?.bannerType === 'html';

  const { data: topBooked = [], isLoading: topBookedLoading } = useQuery({
    queryKey: ['services', 'popular', 'banner-page'],
    queryFn: async () => {
      const res = await serviceApi.list({ popular: true, limit: 8 });
      return res.data.data;
    },
    enabled: showTopBooked,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !banner) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Promotion not found</h1>
        <p className="mt-2 text-slate-600">This offer may have expired or is no longer available.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: banner.title },
          ]}
        />

        <div className="mt-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <header className="mt-6">
          <h1 className="text-3xl font-bold text-slate-900">{banner.title}</h1>
          {banner.subtitle && <p className="mt-2 text-lg text-slate-600">{banner.subtitle}</p>}
          {banner.couponId?.code && (
            <p className="mt-3 inline-block rounded-lg bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              Use code: {banner.couponId.code}
            </p>
          )}
        </header>
      </div>

      {banner.bannerType === 'coupon' && (
        <section className="mx-auto mt-8 max-w-2xl px-4">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
            {banner.couponId?.name && (
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                {banner.couponId.name}
              </p>
            )}
            {banner.couponId?.code ? (
              <>
                <p className="mt-3 font-mono text-3xl font-bold tracking-wider text-slate-900">
                  {banner.couponId.code}
                </p>
                <div className="mt-6 flex justify-center">
                  <CopyCouponButton code={banner.couponId.code} />
                </div>
              </>
            ) : (
              <p className="text-slate-600">No coupon is linked to this promotion.</p>
            )}
            {banner.couponId?.displayValue && (
              <p className="mt-4 text-lg font-semibold text-teal-800">{banner.couponId.displayValue}</p>
            )}
            {banner.couponId?.description && (
              <p className="mt-2 text-sm text-slate-600">{banner.couponId.description}</p>
            )}
            <p className="mt-4 text-sm text-slate-500">Apply this code at checkout to save on your booking.</p>
          </div>
        </section>
      )}

      {banner.bannerType === 'html' && banner.htmlContent && (
        <section className="mx-auto mt-8 max-w-4xl px-4">
          <div
            className="prose prose-slate max-w-none rounded-2xl border bg-white p-6 shadow-sm [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: banner.htmlContent }}
          />
        </section>
      )}

      {banner.bannerType === 'services' && (
        <section className="mx-auto mt-8 max-w-7xl px-4">
          {banner.services && banner.services.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {banner.services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-12 text-center text-slate-600">
              No services are available for this promotion right now.
            </div>
          )}
        </section>
      )}

      {showTopBooked && (
        <section className="mx-auto mt-12 max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Top Booked Services</h2>
          <p className="mt-1 text-slate-600">Popular services customers are booking right now</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topBookedLoading
              ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
              : topBooked.map((service) => <ServiceCard key={service._id} service={service} />)}
          </div>
        </section>
      )}
    </div>
  );
}
