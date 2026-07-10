'use client';

import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/api';
import { BusinessCard } from '@/components/business/BusinessCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export default function BusinessesPage() {
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses-public'],
    queryFn: async () => {
      const res = await businessApi.listPublic({ limit: 24 });
      return res.data.data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Businesses' }]} />
      <h1 className="mt-4 text-3xl font-bold">Featured Businesses</h1>
      <p className="mt-2 text-slate-600">Trusted service providers on MyEasyHand</p>

      {isLoading && <p className="mt-8 text-slate-500">Loading...</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <BusinessCard key={b._id} business={b} />
        ))}
      </div>
    </div>
  );
}
