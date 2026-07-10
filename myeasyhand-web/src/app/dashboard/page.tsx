'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Wallet, Bell, ChevronRight } from 'lucide-react';
import { bookingApi, notificationApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useAuthStore } from '@/stores/auth.store';
import { formatPrice, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  useProtectedRoute();
  const { user } = useAuthStore();

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await bookingApi.list({ limit: 5 });
      return res.data.data;
    },
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
  });

  const upcoming = bookings.filter((b) => !['completed', 'cancelled', 'closed', 'rejected'].includes(b.status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
      <p className="mt-1 text-slate-600">Manage your bookings and account</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-slate-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹0</p>
              <p className="text-sm text-slate-500">Wallet Balance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unread}</p>
              <p className="text-sm text-slate-500">Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">No bookings yet</CardContent>
              </Card>
            ) : (
              bookings.map((b) => (
                <Link key={b._id} href={`/dashboard/bookings/${b._id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between pt-6">
                      <div>
                        <p className="font-mono text-xs text-slate-500">{b.bookingNumber}</p>
                        <p className="font-medium">{b.serviceId?.name || 'Service'}</p>
                        <p className="text-sm text-slate-500">{formatDate(b.scheduledAt)}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={BOOKING_STATUS_COLORS[b.status] || ''}>{b.status.replace(/_/g, ' ')}</Badge>
                        <p className="mt-2 font-bold">{formatPrice(b.totalAmount)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="mt-4 space-y-2">
            {[
              { href: '/dashboard/profile', label: 'Profile Settings' },
              { href: '/dashboard/bookings', label: 'My Bookings' },
              { href: '/dashboard/notifications', label: 'Notifications' },
              { href: '/dashboard/payments', label: 'Payment History' },
              { href: '/services', label: 'Book a Service' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm font-medium hover:bg-slate-50"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
