'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { formatDate, formatPrice } from '@/lib/utils';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  useProtectedRoute();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await bookingApi.list({ limit: 50 });
      return res.data.data;
    },
  });

  const paidBookings = bookings.filter((b) => ['paid', 'completed', 'closed'].includes(b.paymentStatus) || b.paidAmount);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Payment History' }]} />
      <h1 className="mt-4 text-2xl font-bold">Payment History</h1>

      {isLoading && <p className="mt-8 text-slate-500">Loading...</p>}

      <div className="mt-6 space-y-4">
        {paidBookings.map((b) => (
          <div key={b._id} className="rounded-xl border bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="font-mono text-sm text-slate-500">{b.bookingNumber}</p>
                <p className="font-medium">{b.serviceId?.name || 'Service'}</p>
                <p className="text-sm text-slate-500">{formatDate(b.scheduledAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatPrice(b.paidAmount || b.totalAmount)}</p>
                <Badge variant="success" className="mt-1 capitalize">
                  {b.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && paidBookings.length === 0 && (
          <p className="text-center text-slate-500">No payment history yet</p>
        )}
      </div>
    </div>
  );
}
