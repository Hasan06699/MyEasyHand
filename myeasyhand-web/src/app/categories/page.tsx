'use client';

import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '@/lib/api';
import { CategoryCard } from '@/components/services/CategoryCard';
import { CategoryCardSkeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CityRequiredGate } from '@/components/location/CityPicker';
import { useCityStore } from '@/stores/city.store';

function CategoriesCatalog() {
  const city = useCityStore((s) => s.city);
  const cityKey = city?.slug || city?.name || '';

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', cityKey],
    queryFn: async () => {
      const res = await serviceApi.categories(true, cityKey);
      return res.data.data.filter((c) => !c.parentId);
    },
    enabled: !!city,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />
      <h1 className="mt-4 text-3xl font-bold">Categories in {city?.name}</h1>
      <p className="mt-2 text-slate-600">
        Only categories with available services in your city are listed.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <CategoryCardSkeleton key={i} />)
          : categories.map((cat) => <CategoryCard key={cat._id} category={cat} />)}
      </div>
      {!isLoading && categories.length === 0 && (
        <p className="mt-8 text-center text-slate-500">No categories available in {city?.name} yet.</p>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <CityRequiredGate>
      <CategoriesCatalog />
    </CityRequiredGate>
  );
}
