'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, ShoppingCart } from 'lucide-react';
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
    <div className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/services/${service._id}`} className="block">
        <div className="relative h-44 overflow-hidden bg-slate-100">
          <Image
            src={getMediaUrl(service.image || service.serviceImage)}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {service.discountPercent ? (
            <Badge className="absolute left-3 top-3 bg-red-500 text-white">{service.discountPercent}% OFF</Badge>
          ) : null}
          {service.isPopular && (
            <Badge variant="warning" className="absolute right-3 top-3">
              Popular
            </Badge>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{getCategoryName(service)}</p>
        <Link href={`/services/${service._id}`}>
          <h3 className="mt-1 line-clamp-1 text-base font-semibold text-slate-900 hover:text-blue-600">
            {service.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-slate-500">{getBusinessName(service)}</p>
        {service.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{service.shortDescription}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {service.averageRating ? (
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              {service.averageRating.toFixed(1)}
            </span>
          ) : null}
          {service.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatServiceDuration(service)}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {isQuote ? 'Get Quote' : formatPrice(price)}
              {service.priceType === 'hourly' && !isQuote && <span className="text-sm font-normal">/hr</span>}
            </p>
            {service.mrp && service.mrp > price && (
              <p className="text-xs text-slate-400 line-through">{formatPrice(service.mrp)}</p>
            )}
          </div>
          <div className="flex gap-2">
            {showAddToCart && !isQuote && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  addItem(service);
                  toast.success('Added to cart');
                }}
                aria-label="Add to cart"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
            <Link href={isQuote ? `/services/${service._id}` : `/services/${service._id}/book`}>
              <Button size="sm">{isQuote ? 'Request' : 'Book'}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
