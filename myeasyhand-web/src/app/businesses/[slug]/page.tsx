'use client';

import { use } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Globe } from 'lucide-react';
import { businessApi, serviceApi } from '@/lib/api';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getMediaUrl } from '@/lib/utils';

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: async () => {
      const res = await businessApi.getBySlug(slug);
      return res.data.data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', 'business', business?._id],
    queryFn: async () => {
      const res = await serviceApi.list({ businessId: business!._id, limit: 24 });
      return res.data.data;
    },
    enabled: !!business?._id,
  });

  if (isLoading || !business) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="relative h-48 bg-gradient-to-br from-blue-600 to-violet-600 md:h-64">
        {business.banner && (
          <Image src={getMediaUrl(business.banner)} alt={business.name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="relative -mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
            {business.logo ? (
              <Image src={getMediaUrl(business.logo)} alt={business.name} width={80} height={80} className="object-cover" />
            ) : (
              <span className="text-3xl font-bold text-blue-600">{business.name.charAt(0)}</span>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{business.name}</h1>
            {business.address?.city && (
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <MapPin className="h-4 w-4" />
                {business.address.city}
                {business.address.state ? `, ${business.address.state}` : ''}
              </p>
            )}
          </div>
        </div>

        <Breadcrumbs items={[{ label: 'Businesses', href: '/businesses' }, { label: business.name }]} className="mt-6" />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {business.about && (
              <section>
                <h2 className="text-lg font-semibold">About</h2>
                <p className="mt-3 text-slate-600">{business.about}</p>
              </section>
            )}
            {business.companyOverview && (
              <section className="mt-6">
                <h2 className="text-lg font-semibold">Overview</h2>
                <p className="mt-3 text-slate-600">{business.companyOverview}</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-lg font-semibold">Services ({services.length})</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            {business.phone && (
              <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.social?.website && (
              <a
                href={business.social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:bg-slate-50"
              >
                <Globe className="h-5 w-5 text-blue-600" />
                <span>Visit Website</span>
              </a>
            )}
            {business.yearsOfExperience && (
              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{business.yearsOfExperience}+</p>
                <p className="text-sm text-slate-500">Years of Experience</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
