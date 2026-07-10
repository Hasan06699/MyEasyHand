import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import type { Business } from '@/types';
import { getMediaUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-32 bg-gradient-to-br from-blue-600 to-violet-600">
        {business.banner && (
          <Image src={getMediaUrl(business.banner)} alt={business.name} fill className="object-cover" />
        )}
        <div className="absolute -bottom-6 left-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-md">
            {business.logo ? (
              <Image src={getMediaUrl(business.logo)} alt={business.name} width={48} height={48} className="object-cover" />
            ) : (
              <span className="text-lg font-bold text-blue-600">{business.name.charAt(0)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">{business.name}</h3>
          {business.emergencyServiceAvailable && <Badge variant="warning">24/7</Badge>}
        </div>
        {business.about && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{business.about}</p>}
        {business.address?.city && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {business.address.city}
            {business.address.state ? `, ${business.address.state}` : ''}
          </p>
        )}
        {business.yearsOfExperience ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            {business.yearsOfExperience}+ years experience
          </p>
        ) : null}
      </div>
    </Link>
  );
}
