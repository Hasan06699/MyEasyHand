'use client';

import Link from 'next/link';
import { Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppPromotion() {
  return (
    <section className="overflow-hidden rounded-2xl gradient-primary px-6 py-12 text-white md:px-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 text-blue-200">
            <Smartphone className="h-5 w-5" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">Get the MyEasyHand App</h2>
          <p className="mt-3 text-blue-100">
            Book services on the go, track your bookings in real-time, and get exclusive app-only offers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-white text-blue-700 hover:bg-blue-50" disabled>
              <Download className="mr-2 h-4 w-4" />
              App Store
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10" disabled>
              <Download className="mr-2 h-4 w-4" />
              Google Play
            </Button>
          </div>
        </div>
        <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-white/10 backdrop-blur">
          <Smartphone className="h-24 w-24 text-white/80" />
        </div>
      </div>
    </section>
  );
}
