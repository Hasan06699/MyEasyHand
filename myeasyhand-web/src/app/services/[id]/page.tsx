'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Clock, Star, ShoppingCart, CheckCircle } from 'lucide-react';
import { serviceApi, promotionApi } from '@/lib/api';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice, getMediaUrl, getServicePrice, getBusinessName } from '@/lib/utils';
import { toast } from '@/components/ui/toast-provider';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const addItem = useCartStore((s) => s.addItem);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const res = await serviceApi.getById(id);
      return res.data.data;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ['services-related', service?.parentCategoryId],
    queryFn: async () => {
      const res = await serviceApi.list({
        parentCategoryId: typeof service?.parentCategoryId === 'object' ? service.parentCategoryId._id : undefined,
        limit: 4,
      });
      return res.data.data.filter((s) => s._id !== id);
    },
    enabled: !!service,
  });

  const { data: promoBanners = [] } = useQuery({
    queryKey: ['banners', 'service', id],
    queryFn: async () => {
      const res = await promotionApi.activeBanners({ location: 'service_details', platform: 'website' });
      return res.data.data;
    },
  });

  if (isLoading || !service) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Loading...</div>;
  }

  const price = getServicePrice(service);
  const isQuote = service.priceType === 'quote-based';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Services', href: '/services' },
          { label: service.parentCategoryId?.name || 'Category', href: '/categories' },
          { label: service.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={getMediaUrl(service.image || service.serviceImage)}
              alt={service.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {service.gallery && service.gallery.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {service.gallery.map((g) => (
                <div key={g._id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={getMediaUrl(g.url)} alt={g.caption || ''} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {service.isFeatured && <Badge>Featured</Badge>}
            {service.isPopular && <Badge variant="warning">Popular</Badge>}
            {service.discountPercent ? <Badge variant="destructive">{service.discountPercent}% OFF</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{service.name}</h1>
          <p className="mt-1 text-slate-600">{getBusinessName(service)}</p>

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
            {service.averageRating && (
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {service.averageRating.toFixed(1)} ({service.reviewCount} reviews)
              </span>
            )}
            {service.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {service.duration} {service.durationUnit}
              </span>
            )}
          </div>

          <div className="mt-6">
            <p className="text-3xl font-bold text-slate-900">
              {isQuote ? 'Get Quote' : formatPrice(price)}
              {service.priceType === 'hourly' && !isQuote && <span className="text-base font-normal">/hr</span>}
            </p>
            {service.mrp && service.mrp > price && (
              <p className="text-sm text-slate-400 line-through">{formatPrice(service.mrp)}</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {!isQuote && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  addItem(service);
                  toast.success('Added to cart');
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            )}
            <Link href={`/services/${id}/book`}>
              <Button size="lg">{isQuote ? 'Request Quote' : 'Book Now'}</Button>
            </Link>
          </div>

          {service.features && service.features.length > 0 && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold">What&apos;s Included</h3>
                <ul className="mt-3 space-y-2">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {service.fullDescription && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">About This Service</h2>
          <p className="mt-4 whitespace-pre-line text-slate-600">{service.fullDescription}</p>
        </section>
      )}

      {service.faqs && service.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">FAQs</h2>
          <div className="mt-4 space-y-4">
            {service.faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-medium">{faq.question}</h3>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className="mt-12 rounded-2xl bg-blue-50 p-6">
          {promoBanners[0].htmlContent ? (
            <div dangerouslySetInnerHTML={{ __html: promoBanners[0].htmlContent }} />
          ) : (
            <h3 className="font-semibold text-blue-900">{promoBanners[0].title}</h3>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Related Services</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
