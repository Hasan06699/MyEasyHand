'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { serviceApi } from '@/lib/api';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CityRequiredGate } from '@/components/location/CityPicker';
import { useCityStore } from '@/stores/city.store';
import { filterServicesClient, sortServicesClient } from '@/lib/utils';

function ServicesCatalog() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const city = useCityStore((s) => s.city);
  const cityKey = city?.slug || city?.name || '';

  const { data, isLoading } = useQuery({
    queryKey: ['services', page, cityKey],
    queryFn: async () => {
      const res = await serviceApi.list({ page, limit: 24, city: cityKey });
      return res.data;
    },
    enabled: !!city,
  });

  const services = useMemo(() => {
    let list = data?.data ?? [];
    list = filterServicesClient(list, query);
    if (minPrice) list = list.filter((s) => (s.salePrice ?? s.basePrice ?? 0) >= Number(minPrice));
    if (maxPrice) list = list.filter((s) => (s.salePrice ?? s.basePrice ?? 0) <= Number(maxPrice));
    return sortServicesClient(list, sort);
  }, [data, query, sort, minPrice, maxPrice]);

  const total = data?.meta?.total ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Services' }]} />
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services in {city?.name}</h1>
          <p className="mt-1 text-slate-600">{total} services available in your city</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="sm:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="mt-8 flex gap-8">
        <aside className={`w-64 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div>
            <label className="text-sm font-medium">Search</label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Price Range (₹)</label>
            <div className="mt-1 flex gap-2">
              <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <EmptyState title="No services found" description="Try adjusting your filters or search query." />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard key={service._id} service={service} />
                ))}
              </div>
              {total > page * 24 && (
                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPageClient() {
  return (
    <CityRequiredGate>
      <ServicesCatalog />
    </CityRequiredGate>
  );
}
