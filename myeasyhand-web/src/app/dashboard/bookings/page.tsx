'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BOOKING_STATUS_COLORS } from '@/lib/constants';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const tabs = [
  { key: 'active', label: 'Active', statuses: ['pending', 'accepted', 'employee_assigned', 'employee_accepted', 'visit_scheduled', 'visit_started', 'service_in_progress', 'awaiting_customer_approval', 'approved'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'paid', 'closed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'rejected', 'no_show', 'refunded'] },
];

export default function BookingsPage() {
  useProtectedRoute();
  const [tab, setTab] = useState('active');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await bookingApi.list({ limit: 50 });
      return res.data.data;
    },
  });

  const currentTab = tabs.find((t) => t.key === tab)!;
  const filtered = bookings.filter((b) => currentTab.statuses.includes(b.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Bookings' }]} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link href="/services">
          <Button>Book a Service</Button>
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-slate-500">Loading bookings...</p>}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title="No bookings" description={`You have no ${tab} bookings.`} className="mt-8" />
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((booking) => (
          <Link
            key={booking._id}
            href={`/dashboard/bookings/${booking._id}`}
            className="block rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-slate-500">{booking.bookingNumber}</p>
                <h3 className="mt-1 text-lg font-semibold">{booking.serviceId?.name || 'Service'}</h3>
                <p className="mt-1 text-sm text-slate-600">{formatDate(booking.scheduledAt)}</p>
              </div>
              <div className="text-right">
                <Badge className={BOOKING_STATUS_COLORS[booking.status] || ''}>
                  {booking.status.replace(/_/g, ' ')}
                </Badge>
                <p className="mt-2 font-bold">{formatPrice(booking.totalAmount)}</p>
                <p className="text-xs capitalize text-slate-500">{booking.paymentStatus}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
