'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { bookingApi, couponApi } from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { clearServerCart } from '@/lib/cart-sync';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { formatPrice, getBusinessId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { toast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

const checkoutSchema = z.object({
  scheduledAt: z.string().min(1, 'Please select a date and time'),
  cityName: z.string().min(2, 'City is required'),
  areaName: z.string().min(2, 'Area / locality is required'),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export default function CheckoutPage() {
  useProtectedRoute();
  const router = useRouter();
  const {
    items,
    scheduledAt,
    setScheduledAt,
    notes,
    setNotes,
    couponCode,
    setCouponCode,
    cityName,
    areaName,
    setLocation,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    clear,
    businessGroups,
  } = useCartStore();

  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(
      checkoutSchema.refine(
        (data) => {
          if (!data.scheduledAt) return false;
          return new Date(data.scheduledAt) > new Date();
        },
        { message: 'Please select a future date and time', path: ['scheduledAt'] },
      ),
    ),
    defaultValues: {
      scheduledAt: scheduledAt || '',
      cityName: cityName || '',
      areaName: areaName || '',
      notes: notes || '',
      couponCode: couponCode || '',
    },
  });

  const formCity = watch('cityName');
  const formArea = watch('areaName');

  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutForm) =>
      bookingApi.checkout({
        items: items.map((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
          ...(i.notes ? { notes: i.notes } : {}),
        })),
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        notes: data.notes || undefined,
        couponCode: data.couponCode || undefined,
        cityName: data.cityName,
        areaName: data.areaName,
      }),
    onSuccess: async () => {
      clear();
      await clearServerCart();
      toast.success('Booking confirmed!');
      router.push('/dashboard/bookings');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Checkout failed');
    },
  });

  const handleValidateCoupon = async () => {
    const code = watch('couponCode');
    if (!code || items.length === 0) {
      setCouponError('Enter a coupon code');
      return;
    }
    setCouponError('');
    setValidatingCoupon(true);
    try {
      const firstBusinessId = getBusinessId(items[0].service);
      const res = await couponApi.validate({
        code,
        businessId: firstBusinessId,
        subtotal: subtotal(),
        serviceIds: items.map((i) => i.serviceId),
        cityName: formCity,
        areaName: formArea,
      });
      if (res.data.data.valid) {
        setDiscount(res.data.data.discountAmount ?? 0);
        setCouponCode(code);
        toast.success(res.data.data.message || 'Coupon applied!');
      } else {
        setDiscount(0);
        setCouponError(res.data.data.message || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const onSubmit = (data: CheckoutForm) => {
    setScheduledAt(data.scheduledAt);
    setNotes(data.notes || '');
    setLocation(data.cityName, data.areaName);
    checkoutMutation.mutate(data);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p>Your cart is empty.</p>
        <Button className="mt-4" onClick={() => router.push('/services')}>
          Browse Services
        </Button>
      </div>
    );
  }

  const tax = Math.round((subtotal() - discount) * 0.18);
  const total = subtotal() - discount + tax;
  const groups = businessGroups();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mt-4 text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
        <Card className={cn(isSubmitted && errors.scheduledAt && 'border-red-300')}>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-semibold">Schedule *</h3>
            <div>
              <Input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                {...register('scheduledAt', {
                  onChange: (e) => setScheduledAt(e.target.value),
                })}
                className={cn(errors.scheduledAt && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError message={errors.scheduledAt?.message} />
            </div>
            <div>
              <Input
                {...register('notes', { onChange: (e) => setNotes(e.target.value) })}
                placeholder="Booking notes (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isSubmitted && (errors.cityName || errors.areaName) && 'border-red-300')}>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-semibold">Service Address *</h3>
            <div>
              <Input
                {...register('cityName', {
                  onChange: (e) => setLocation(e.target.value, formArea),
                })}
                placeholder="City"
                className={cn(errors.cityName && 'border-red-400')}
              />
              <FieldError message={errors.cityName?.message} />
            </div>
            <div>
              <Input
                {...register('areaName', {
                  onChange: (e) => setLocation(formCity, e.target.value),
                })}
                placeholder="Area / Locality"
                className={cn(errors.areaName && 'border-red-400')}
              />
              <FieldError message={errors.areaName?.message} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-semibold">Coupon Code</h3>
            <div className="flex gap-2">
              <Input
                {...register('couponCode', {
                  onChange: (e) => {
                    setCouponCode(e.target.value);
                    setCouponError('');
                    setDiscount(0);
                  },
                })}
                placeholder="Enter coupon"
                className={cn(couponError && 'border-red-400')}
              />
              <Button type="button" variant="outline" onClick={handleValidateCoupon} disabled={validatingCoupon}>
                Apply
              </Button>
            </div>
            <FieldError message={couponError} />
            {discount > 0 && (
              <p className="text-sm text-green-600">Coupon applied — you save {formatPrice(discount)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-semibold">Payment Method</h3>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'online' ? 'primary' : 'outline'}
                onClick={() => setPaymentMethod('online')}
              >
                Pay Online
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash on Service
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="font-semibold">Order Summary</h3>
            {Object.entries(groups).map(([bid, groupItems]) => (
              <div key={bid} className="border-b pb-3 text-sm">
                <p className="font-medium text-slate-700">Vendor Group</p>
                {groupItems.map((i) => (
                  <div key={i.serviceId} className="flex justify-between text-slate-600">
                    <span>
                      {i.service.name} × {i.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal())}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>GST (18%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>

        {isSubmitted && Object.keys(errors).length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix the highlighted fields before continuing.
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={checkoutMutation.isPending}>
          {checkoutMutation.isPending ? 'Processing...' : paymentMethod === 'online' ? 'Pay & Book' : 'Confirm Booking'}
        </Button>
      </form>
    </div>
  );
}
