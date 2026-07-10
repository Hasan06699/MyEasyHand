'use client';

import { Check } from 'lucide-react';
import type { BookingStatus } from '@/types';
import { BOOKING_TRACKING_STEPS } from '@/lib/constants';
import { getBookingStepIndex } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function BookingTracker({ status }: { status: BookingStatus }) {
  const currentIndex = getBookingStepIndex(status);
  const isCancelled = ['cancelled', 'rejected', 'no_show', 'refunded'].includes(status);

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
        Booking {status.replace('_', ' ')}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {BOOKING_TRACKING_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                  done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-200 bg-white text-slate-400',
                  active && 'ring-4 ring-green-100',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < BOOKING_TRACKING_STEPS.length - 1 && (
                <div className={cn('h-10 w-0.5', done ? 'bg-green-500' : 'bg-slate-200')} />
              )}
            </div>
            <div className="pb-8 pt-1">
              <p className={cn('text-sm font-medium', done ? 'text-slate-900' : 'text-slate-400')}>{step.label}</p>
              {active && <p className="text-xs text-green-600">Current status</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
