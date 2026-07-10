'use client';

import { Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppPromotion() {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-[#0B1F3A] px-6 py-12 text-white shadow-lift md:px-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-orange/20 px-3 py-1 text-sm font-bold text-brand-orange-light">
            <Smartphone className="h-4 w-4" />
            Coming soon
          </div>
          <h2 className="mt-4 text-2xl font-extrabold md:text-3xl">Get the MyEasyHand app</h2>
          <p className="mt-3 text-slate-300">
            Book on the go, track visits in real time, and unlock app-only offers for home repairs &amp; cleaning.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-white text-brand-blue-dark hover:bg-white/90" disabled>
              <Download className="h-4 w-4" />
              App Store
            </Button>
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" disabled>
              <Download className="h-4 w-4" />
              Google Play
            </Button>
          </div>
        </div>
        <div className="flex h-44 w-44 items-center justify-center rounded-[2rem] bg-gradient-to-br from-brand-blue to-brand-orange shadow-lift">
          <Smartphone className="h-20 w-20 text-white" />
        </div>
      </div>
    </section>
  );
}
