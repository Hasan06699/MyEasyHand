'use client';

import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '@/lib/api';
import { CategoryCard } from '@/components/services/CategoryCard';
import { CategoryCardSkeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return res.data.data.filter((c) => !c.parentId);
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />
      <h1 className="mt-4 text-3xl font-bold">Service Categories</h1>
      <p className="mt-2 text-slate-600">Browse services by category</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <CategoryCardSkeleton key={i} />)
          : categories.map((cat) => <CategoryCard key={cat._id} category={cat} />)}
      </div>
    </div>
  );
}
