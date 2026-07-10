'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tag, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryCard } from '@/components/services/CategoryCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { BusinessCard } from '@/components/business/BusinessCard';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { AppPromotion } from '@/components/home/AppPromotion';
import { CityRequiredGate } from '@/components/location/CityPicker';
import { ServiceCardSkeleton, CategoryCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { useCityStore } from '@/stores/city.store';
import { promotionApi, serviceApi, businessApi } from '@/lib/api';
import {
  normalizePromotionBanner,
  normalizeServiceRow,
  type ApiPromotionBanner,
  type ApiServiceRow,
} from '@/lib/promotions';

function SectionHeading({
  kicker,
  title,
  href,
  actionLabel = 'View all',
}: {
  kicker?: ReactNode;
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          <Button variant="soft" size="sm" className="gap-1">
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function HomeCatalog() {
  const city = useCityStore((s) => s.city);
  const cityKey = city?.slug || city?.name || '';

  const { data: banners = [] } = useQuery({
    queryKey: ['banners', 'home', cityKey],
    queryFn: async () => {
      const res = await promotionApi.activeBanners({
        location: 'home',
        platform: 'website',
        city: city?.name,
      });
      return (res.data.data as ApiPromotionBanner[])
        .map(normalizePromotionBanner)
        .filter((b): b is NonNullable<typeof b> => b !== null);
    },
    enabled: !!city,
  });

  const { data: serviceRows = [] } = useQuery({
    queryKey: ['service-rows', 'home', cityKey],
    queryFn: async () => {
      const res = await promotionApi.activeServiceRows({
        location: 'home',
        platform: 'website',
        city: city?.name,
      });
      return (res.data.data as ApiServiceRow[]).map(normalizeServiceRow);
    },
    enabled: !!city,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', cityKey],
    queryFn: async () => {
      const res = await serviceApi.categories(true, cityKey);
      return res.data.data.filter((c) => !c.parentId);
    },
    enabled: !!city,
  });

  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['services', 'featured', cityKey],
    queryFn: async () => {
      const res = await serviceApi.list({ featured: true, limit: 8, city: cityKey });
      return res.data.data;
    },
    enabled: !!city,
  });

  const { data: popular = [] } = useQuery({
    queryKey: ['services', 'popular', cityKey],
    queryFn: async () => {
      const res = await serviceApi.list({ popular: true, limit: 8, city: cityKey });
      return res.data.data;
    },
    enabled: !!city,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['services', 'recent', cityKey],
    queryFn: async () => {
      const res = await serviceApi.list({ limit: 8, city: cityKey });
      return res.data.data;
    },
    enabled: !!city,
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses-public', cityKey],
    queryFn: async () => {
      const res = await businessApi.listPublic({ limit: 6 });
      return res.data.data;
    },
    enabled: !!city,
  });

  return (
    <div className="pb-24 md:pb-16">
      <section className="gradient-mesh relative overflow-hidden border-b border-brand-blue/10">
        <div className="section-shell relative z-10 grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="section-kicker">
              <MapPin className="h-3.5 w-3.5" />
              Services in {city?.name}
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.1] text-slate-900 md:text-5xl">
              Book home repairs &amp; cleaning{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
                in {city?.name}
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              {BRAND.tagline}. Only services available in your selected city are shown.
            </p>
            <div className="mt-8">
              <SearchBar />
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-brand-blue/10">
              <BannerCarousel banners={banners} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-16 pt-14">
        <section className="section-shell">
          <SectionHeading kicker="Browse" title={`Categories in ${city?.name}`} href="/categories" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)
              : categories.slice(0, 6).map((cat) => <CategoryCard key={cat._id} category={cat} />)}
          </div>
          {!categoriesLoading && categories.length === 0 && (
            <p className="mt-4 text-center text-slate-500">
              No categories with services in {city?.name} yet.
            </p>
          )}
        </section>

        {serviceRows.map((row) => (
          <section key={row._id} className="section-shell">
            <SectionHeading kicker="Curated" title={row.title} />
            {row.subtitle && <p className="-mt-4 mb-6 text-slate-600">{row.subtitle}</p>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {row.services?.map((service) => <ServiceCard key={service._id} service={service} />)}
            </div>
          </section>
        ))}

        <section className="section-shell">
          <SectionHeading kicker="Trending" title="Popular right now" href="/services?popular=true" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.length
              ? popular.map((s) => <ServiceCard key={s._id} service={s} />)
              : featuredLoading
                ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                : (
                  <p className="col-span-full text-slate-500">No popular services in this city yet.</p>
                )}
          </div>
        </section>

        <section className="section-shell">
          <SectionHeading
            kicker={
              <>
                <Sparkles className="h-3.5 w-3.5" /> Featured
              </>
            }
            title="Hand-picked for you"
            href="/services?featured=true"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
              : featured.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
        </section>

        <section className="section-shell">
          <SectionHeading kicker="New" title="Just added" href="/services" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
        </section>

        <section className="section-shell">
          <div className="relative overflow-hidden rounded-[2rem] gradient-brand p-8 text-white shadow-lift md:p-10">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Tag className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold">Coupons &amp; instant savings</h3>
                  <p className="mt-1 max-w-md text-sm text-white/85">
                    Apply promo codes at checkout — exclusive deals for MyEasyHand customers.
                  </p>
                </div>
              </div>
              <Link href="/services">
                <Button className="bg-white text-brand-blue-dark hover:bg-white/90" size="lg">
                  Browse deals
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="section-shell">
          <SectionHeading kicker="Trusted partners" title="Featured businesses" href="/businesses" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b._id} business={b} />
            ))}
          </div>
        </section>

        <div className="section-shell">
          <HowItWorks />
        </div>
        <div className="section-shell">
          <CustomerReviews />
        </div>
        <div className="section-shell">
          <AppPromotion />
        </div>
      </div>
    </div>
  );
}

export function HomePageClient() {
  return (
    <CityRequiredGate>
      <HomeCatalog />
    </CityRequiredGate>
  );
}
