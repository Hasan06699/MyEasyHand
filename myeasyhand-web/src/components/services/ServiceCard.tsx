'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import type { Service } from '@/types';
import { formatPrice, getMediaUrl, getServicePrice, getBusinessName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart.store';
import { toast } from '@/components/ui/toast-provider';

function getCategoryName(service: Service): string {
  const sub = service.subCategoryId?.name;
  const parent = service.parentCategoryId?.name;
  if (sub && parent) return `${parent} › ${sub}`;
  return sub || parent || 'Service';
}

function formatServiceDuration(service: Service): string {
  if (!service.duration) return '';
  const unit = service.durationUnit ?? 'minute';
  const label = unit === 'minute' ? 'min' : unit === 'hour' ? 'hr' : 'day';
  return `${service.duration} ${label}`;
}

export function ServiceCard({ service, showAddToCart = true }: { service: Service; showAddToCart?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const price = getServicePrice(service);
  const isQuote = service.priceType === 'quote-based';

  return (
    <article className="card-surface group flex h-full flex-col overflow-hidden">
      <Link href={`/services/${service._id}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#FFF3E0]">
          <Image
            src={getMediaUrl(service.image || service.serviceImage)}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {service.discountPercent ? (
              <Badge className="rounded-full bg-brand-orange text-white shadow-md">
                {service.discountPercent}% OFF
              </Badge>
            ) : null}
            {service.isPopular && (
              <Badge className="rounded-full bg-white/95 text-brand-blue-dark shadow-md">Popular</Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              {getCategoryName(service)}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/services/${service._id}`}>
          <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-brand-blue">
            {service.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs font-medium text-slate-500">{getBusinessName(service)}</p>
        {service.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{service.shortDescription}</p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {service.averageRating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-current" />
              {service.averageRating.toFixed(1)}
            </span>
          ) : null}
          {service.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brand-blue" />
              {formatServiceDuration(service)}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#E3F2FD] pt-4">
          <div>
            <p className="text-xl font-extrabold text-brand-blue-dark">
              {isQuote ? 'Get Quote' : formatPrice(price)}
              {service.priceType === 'hourly' && !isQuote && (
                <span className="text-sm font-medium text-slate-500">/hr</span>
              )}
            </p>
            {service.mrp && service.mrp > price && (
              <p className="text-xs text-slate-400 line-through">{formatPrice(service.mrp)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showAddToCart && !isQuote && (
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  addItem(service);
                  toast.success('Added to cart');
                }}
                aria-label="Add to cart"
                className="!h-10 !w-10 !rounded-full !px-0"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
            <Link href={isQuote ? `/services/${service._id}` : `/services/${service._id}/book`}>
              <Button size="sm" variant="accent" className="gap-1">
                {isQuote ? 'Request' : 'Book'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
