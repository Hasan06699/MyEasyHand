'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Star } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookingTracker } from '@/components/booking/BookingTracker';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { BOOKING_STATUS_COLORS } from '@/lib/constants';
import { toast } from '@/components/ui/toast-provider';
import type { BookingStatus } from '@/types';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useProtectedRoute();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await bookingApi.getById(id);
      return res.data.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const approvalMutation = useMutation({
    mutationFn: (decision: 'approved' | 'rejected' | 'changes_requested') =>
      bookingApi.customerApproval(id, decision),
    onSuccess: () => {
      toast.success('Response submitted');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      bookingApi.submitReview(id, { serviceRating: reviewRating, comment: reviewComment }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewComment('');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled');
      refetch();
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Loading booking...</div>;
  }

  if (isError || !data) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'Unable to load this booking.';
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600">{message}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const { booking, lineItems, assignments, payments } = data;
  const approval = booking.customerApproval;
  const visitOtp = booking.visitOtp ?? booking.visitVerification?.otp;
  const visitQrCode = booking.visitQrCode ?? booking.visitVerification?.qrToken;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Bookings', href: '/dashboard/bookings' },
          { label: booking.bookingNumber },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-slate-500">{booking.bookingNumber}</p>
          <h1 className="text-2xl font-bold">{booking.serviceId?.name || 'Service Booking'}</h1>
          <p className="mt-1 text-slate-600">{formatDate(booking.scheduledAt)}</p>
        </div>
        <Badge className={`text-sm ${BOOKING_STATUS_COLORS[booking.status] || ''}`}>
          {booking.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Track Status</h2>
            <div className="mt-4">
              <BookingTracker status={booking.status as BookingStatus} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {(visitOtp || visitQrCode) && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <QrCode className="h-5 w-5" />
                  Visit Verification
                </h2>
                {visitOtp && (
                  <p className="mt-3 text-3xl font-mono font-bold tracking-widest text-blue-600">{visitOtp}</p>
                )}
                {visitQrCode && (
                  <p className="mt-2 text-sm text-slate-500">Show this QR code to the service professional</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold">Price Summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(booking.subtotal)}</span>
                </div>
                {booking.discountAmount ? (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                ) : null}
                {booking.taxAmount ? (
                  <div className="flex justify-between">
                    <span>Tax (GST)</span>
                    <span>{formatPrice(booking.taxAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {lineItems.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold">Services</h2>
            <div className="mt-3 space-y-2">
              {lineItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {approval?.status === 'pending' && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-orange-900">Approval Required</h2>
            <p className="mt-2 text-sm text-orange-800">
              The service provider has updated your booking. Please review and approve.
            </p>
            {approval.draftAmount && (
              <p className="mt-2 font-bold">Updated Amount: {formatPrice(approval.draftAmount)}</p>
            )}
            {approval.changes && (
              <div className="mt-3 space-y-1 text-sm">
                {approval.changes.addedServices?.map((s, i) => (
                  <p key={i} className="text-green-700">+ {s.name}: {formatPrice(s.amount)}</p>
                ))}
                {approval.changes.removedServices?.map((s, i) => (
                  <p key={i} className="text-red-700">- {s.name}: {formatPrice(s.amount)}</p>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={() => approvalMutation.mutate('approved')} disabled={approvalMutation.isPending}>
                Approve
              </Button>
              <Button variant="outline" onClick={() => approvalMutation.mutate('rejected')}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold">Assigned Professional</h2>
            {assignments.map((a) => {
              const name = a.userId
                ? `${a.userId.firstName ?? ''} ${a.userId.lastName ?? ''}`.trim()
                : a.employeeId?.firstName
                  ? `${a.employeeId.firstName} ${a.employeeId.lastName ?? ''}`.trim()
                  : 'Assigned professional';
              const initial = (a.userId?.firstName ?? a.employeeId?.firstName)?.charAt(0) ?? '?';
              const response = a.employeeResponse ?? a.response ?? 'pending';
              return (
                <div key={a._id} className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {initial}
                  </div>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs capitalize text-slate-500">{response}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold">Payments</h2>
            {payments.map((p) => (
              <div key={p._id} className="mt-3 flex justify-between text-sm">
                <span className="capitalize">{p.method}</span>
                <span>{formatPrice(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {['completed', 'paid', 'closed'].includes(booking.status) && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Star className="h-5 w-5 text-amber-500" />
              Leave a Review
            </h2>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setReviewRating(r)}>
                  <Star className={`h-6 w-6 ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
            />
            <Button className="mt-3" onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {['pending', 'accepted'].includes(booking.status) && (
        <div className="mt-6">
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Cancel Booking
          </Button>
        </div>
      )}
    </div>
  );
}
