'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useCityStore } from '@/stores/city.store';

export function SearchBar({ className, defaultQuery = '' }: { className?: string; defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const city = useCityStore((s) => s.city);
  const debouncedQuery = useDebounce(query, 200);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city?.name) params.set('city', city.name);
    router.push(`/services?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={cn('w-full', className)}>
      <div className="flex flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-lift ring-1 ring-brand-blue/10 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What service do you need?"
            className="h-12 border-0 bg-transparent pl-12 shadow-none focus-visible:ring-0"
            list="search-suggestions"
          />
          {debouncedQuery.length > 1 && (
            <datalist id="search-suggestions">
              <option value={`${debouncedQuery} cleaning`} />
              <option value={`${debouncedQuery} repair`} />
            </datalist>
          )}
        </div>
        <div className="hidden h-8 w-px bg-brand-blue/15 sm:block" />
        <div className="relative flex min-w-[9rem] items-center gap-2 px-4 text-sm font-semibold text-brand-blue-dark">
          <MapPin className="h-5 w-5 shrink-0 text-brand-orange" />
          <span className="truncate">{city?.name || 'Select city'}</span>
        </div>
        <Button type="submit" variant="accent" size="lg" className="shrink-0 px-8">
          Find services
        </Button>
      </div>
    </form>
  );
}
