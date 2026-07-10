import { Suspense } from 'react';
import ServicesPageClient from './ServicesPageClient';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Browse Services' };

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ServicesPageClient />
    </Suspense>
  );
}
