'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { serviceApi, bookingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, getServicePrice } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { toast } from '@/components/ui/toast-provider';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export default function BookServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const { addItem, scheduledAt, setScheduledAt, notes, setNotes } = useCartStore();
  const [localDate, setLocalDate] = useState(scheduledAt);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    if (!isAuthenticated) router.push(`/login?redirect=/services/${serviceId}/book`);
  }, [isAuthenticated, router, serviceId]);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const res = await serviceApi.getById(serviceId);
      return res.data.data;
    },
  });

  const bookingMutation = useMutation({
    mutationFn: () =>
      bookingApi.checkout({
        items: [{ serviceId, quantity: 1, notes: localNotes || undefined }],
        scheduledAt: new Date(localDate).toISOString(),
        notes: localNotes || undefined,
      }),
    onSuccess: () => {
      toast.success('Booking confirmed!');
      router.push('/dashboard/bookings');
    },
    onError: () => toast.error('Booking failed. Please try again.'),
  });

  if (isLoading || !service) {
    return <div className="mx-auto max-w-lg px-4 py-16">Loading...</div>;
  }

  const price = getServicePrice(service);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Services', href: '/services' },
          { label: service.name, href: `/services/${serviceId}` },
          { label: 'Book' },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">Book: {service.name}</h1>
      <p className="mt-1 text-slate-600">
        {service.priceType === 'quote-based' ? 'Quote-based pricing' : formatPrice(price)}
        {service.duration ? ` · ${service.duration} ${service.durationUnit ?? 'minute'}` : ''}
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Date & Time</label>
            <Input
              type="datetime-local"
              value={localDate}
              onChange={(e) => {
                setLocalDate(e.target.value);
                setScheduledAt(e.target.value);
              }}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <Input
              value={localNotes}
              onChange={(e) => {
                setLocalNotes(e.target.value);
                setNotes(e.target.value);
              }}
              placeholder="Special instructions"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                addItem(service);
                toast.success('Added to cart');
              }}
            >
              Add to Cart
            </Button>
            <Button
              className="flex-1"
              disabled={!localDate || bookingMutation.isPending}
              onClick={() => bookingMutation.mutate()}
            >
              {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
          <Link href="/cart" className="block text-center text-sm text-blue-600 hover:underline">
            Or checkout with multiple services →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
