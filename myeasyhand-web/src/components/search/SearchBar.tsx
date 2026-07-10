'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

export function SearchBar({ className, defaultQuery = '' }: { className?: string; defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    router.push(`/services?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="flex flex-col gap-2 rounded-2xl border bg-white p-2 shadow-lg sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, categories, businesses..."
            className="border-0 pl-10 shadow-none focus-visible:ring-0"
            list="search-suggestions"
          />
          {debouncedQuery.length > 1 && (
            <datalist id="search-suggestions">
              <option value={`${debouncedQuery} cleaning`} />
              <option value={`${debouncedQuery} repair`} />
            </datalist>
          )}
        </div>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location"
            className="border-0 pl-10 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" size="lg" className="shrink-0 rounded-xl px-8">
          Search
        </Button>
      </div>
    </form>
  );
}
