'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice, getMediaUrl, getServicePrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clear } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs items={[{ label: 'Cart' }]} />
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title="Your cart is empty"
          description="Browse services and add them to your cart to book multiple services at once."
          action={
            <Link href="/services">
              <Button>Browse Services</Button>
            </Link>
          }
          className="mt-8"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Cart ({items.length})</h1>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear Cart
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={item.serviceId}>
            <CardContent className="flex gap-4 pt-6">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={getMediaUrl(item.service.image || item.service.serviceImage)}
                  alt={item.service.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.service.name}</h3>
                <p className="text-sm text-slate-500">{formatPrice(getServicePrice(item.service))}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                    className="rounded-lg border p-1 hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                    className="rounded-lg border p-1 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeItem(item.serviceId)} className="ml-auto text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="font-bold">{formatPrice(getServicePrice(item.service) * item.quantity)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm text-slate-500">Subtotal</p>
            <p className="text-2xl font-bold">{formatPrice(subtotal())}</p>
          </div>
          <Link href="/checkout">
            <Button size="lg">Proceed to Checkout</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
