import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import type { Business } from '@/types';
import { getMediaUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="card-surface group relative flex overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand-blue to-brand-orange" />
      <div className="flex flex-1 gap-4 p-4 pl-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#E3F2FD] to-[#FFF3E0] ring-2 ring-white shadow-md">
          {business.logo ? (
            <Image src={getMediaUrl(business.logo)} alt={business.name} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-extrabold text-brand-blue">
              {business.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold text-slate-900 group-hover:text-brand-blue">{business.name}</h3>
            {business.emergencyServiceAvailable && (
              <Badge className="shrink-0 rounded-full bg-brand-orange/15 text-brand-orange-dark">24/7</Badge>
            )}
          </div>
          {business.about && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{business.about}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {business.address?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                {business.address.city}
                {business.address.state ? `, ${business.address.state}` : ''}
              </span>
            )}
            {business.yearsOfExperience ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-current" />
                {business.yearsOfExperience}+ yrs
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-orange" />
      </div>
    </Link>
  );
}
