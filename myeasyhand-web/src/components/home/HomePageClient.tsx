'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tag, Sparkles } from 'lucide-react';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryCard } from '@/components/services/CategoryCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { BusinessCard } from '@/components/business/BusinessCard';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { AppPromotion } from '@/components/home/AppPromotion';
import { ServiceCardSkeleton, CategoryCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { promotionApi, serviceApi, businessApi } from '@/lib/api';
import {
  normalizePromotionBanner,
  normalizeServiceRow,
  type ApiPromotionBanner,
  type ApiServiceRow,
} from '@/lib/promotions';

export function HomePageClient() {
  const { data: banners = [] } = useQuery({
    queryKey: ['banners', 'home'],
    queryFn: async () => {
      const res = await promotionApi.activeBanners({ location: 'home', platform: 'website' });
      return (res.data.data as ApiPromotionBanner[])
        .map(normalizePromotionBanner)
        .filter((b): b is NonNullable<typeof b> => b !== null);
    },
  });

  const { data: serviceRows = [] } = useQuery({
    queryKey: ['service-rows', 'home'],
    queryFn: async () => {
      const res = await promotionApi.activeServiceRows({ location: 'home', platform: 'website' });
      return (res.data.data as ApiServiceRow[]).map(normalizeServiceRow);
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return res.data.data.filter((c) => !c.parentId);
    },
  });

  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: async () => {
      const res = await serviceApi.list({ featured: true, limit: 8 });
      return res.data.data;
    },
  });

  const { data: popular = [] } = useQuery({
    queryKey: ['services', 'popular'],
    queryFn: async () => {
      const res = await serviceApi.list({ popular: true, limit: 8 });
      return res.data.data;
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['services', 'recent'],
    queryFn: async () => {
      const res = await serviceApi.list({ limit: 8 });
      return res.data.data;
    },
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses-public'],
    queryFn: async () => {
      const res = await businessApi.listPublic({ limit: 6 });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-16 pb-16">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <BannerCarousel banners={banners} />
        <div className="relative z-10 -mt-8 mx-auto max-w-3xl px-4">
          <SearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured Categories</h2>
          <Link href="/categories">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categoriesLoading
            ? Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)
            : categories.slice(0, 6).map((cat) => <CategoryCard key={cat._id} category={cat} />)}
        </div>
      </section>

      {serviceRows.map((row) => (
        <section key={row._id} className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{row.title}</h2>
              {row.subtitle && <p className="mt-1 text-slate-600">{row.subtitle}</p>}
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {row.services?.map((service) => <ServiceCard key={service._id} service={service} />)}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-900">Popular Services</h2>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popular.length
            ? popular.map((s) => <ServiceCard key={s._id} service={s} />)
            : featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
              : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-slate-900">Featured Services</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredLoading
            ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
            : featured.map((s) => <ServiceCard key={s._id} service={s} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-slate-900">Recently Added</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((s) => <ServiceCard key={s._id} service={s} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6">
          <Tag className="h-8 w-8 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Exclusive Coupons & Offers</h3>
            <p className="text-sm text-blue-700">Apply coupon codes at checkout for instant savings</p>
          </div>
          <Link href="/services">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured Businesses</h2>
          <Link href="/businesses">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BusinessCard key={b._id} business={b} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <HowItWorks />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <CustomerReviews />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <AppPromotion />
      </div>
    </div>
  );
}
