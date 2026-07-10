'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronDown, Check, X } from 'lucide-react';
import { cityApi } from '@/lib/api';
import { useCityStore, type SelectedCity } from '@/stores/city.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CityPicker({ compact = false }: { compact?: boolean }) {
  const { city, setCity, setAddress } = useCityStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await cityApi.list();
      return res.data.data ?? [];
    },
  });

  const select = (c: SelectedCity) => {
    setCity(c);
    setAddress({
      line1: '',
      city: c.name,
      cityId: c._id,
      state: c.state,
    });
    setOpen(false);
  };

  if (!mounted) {
    return (
      <div className={cn('h-10 w-28 animate-pulse rounded-full bg-brand-soft', compact && 'w-10')} />
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-brand-blue/15 bg-brand-soft/80 px-3 py-2 text-sm font-semibold text-brand-blue-dark transition hover:border-brand-blue/40',
          compact && 'px-2.5',
        )}
      >
        <MapPin className="h-4 w-4 text-brand-orange" />
        {!compact && <span className="max-w-[7rem] truncate">{city?.name || 'Select city'}</span>}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-brand-blue/10">
            <div className="flex items-center justify-between border-b border-brand-blue/10 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Service city</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="px-4 pt-2 text-xs text-slate-500">
              Only services available in your city will be shown.
            </p>
            <ul className="max-h-64 overflow-auto p-2">
              {cities.map((c) => {
                const active = city?._id === c._id;
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition',
                        active ? 'bg-brand-soft font-bold text-brand-blue-dark' : 'hover:bg-slate-50',
                      )}
                    >
                      <span>
                        {c.name}
                        {c.state ? (
                          <span className="ml-1 font-normal text-slate-400">· {c.state}</span>
                        ) : null}
                      </span>
                      {active && <Check className="h-4 w-4 text-brand-orange" />}
                    </button>
                  </li>
                );
              })}
              {cities.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-slate-500">No cities open yet.</li>
              )}
            </ul>
            {city && (
              <div className="border-t border-brand-blue/10 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCity(null);
                    setAddress(null);
                    setOpen(false);
                  }}
                >
                  Clear city
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Full-page gate when no city selected */
export function CityRequiredGate({ children }: { children: React.ReactNode }) {
  const city = useCityStore((s) => s.city);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await cityApi.list();
      return res.data.data ?? [];
    },
  });

  const setCity = useCityStore((s) => s.setCity);
  const setAddress = useCityStore((s) => s.setAddress);

  if (!mounted) return null;
  if (city) return <>{children}</>;

  return (
    <div className="section-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand-blue">
        <MapPin className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Choose your city</h1>
      <p className="mt-2 max-w-md text-slate-600">
        MyEasyHand shows only services available in your location. Select a city to continue.
      </p>
      <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
        {cities.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => {
              setCity(c);
              setAddress({ line1: '', city: c.name, cityId: c._id, state: c.state });
            }}
            className="card-surface rounded-2xl px-4 py-5 text-center font-bold text-slate-900 hover:text-brand-blue"
          >
            {c.name}
            {c.state && <span className="mt-1 block text-xs font-medium text-slate-500">{c.state}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
