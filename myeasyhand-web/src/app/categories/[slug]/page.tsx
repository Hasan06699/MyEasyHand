'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '@/lib/api';
import { findCategoryBySlug } from '@/lib/promotions';
import { ServiceCard } from '@/components/services/ServiceCard';
import { CategoryCard } from '@/components/services/CategoryCard';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CityRequiredGate } from '@/components/location/CityPicker';
import { useCityStore } from '@/stores/city.store';

function CategoryDetailCatalog({ slug }: { slug: string }) {
  const city = useCityStore((s) => s.city);
  const cityKey = city?.slug || city?.name || '';

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', cityKey],
    queryFn: async () => {
      const res = await serviceApi.categories(true, cityKey);
      return res.data.data;
    },
    enabled: !!city,
  });

  const category = findCategoryBySlug(categories, slug);
  const children = category?.children || [];
  const isSubcategory = !!category?.parentId;

  const { data: directServices = [], isLoading: directLoading } = useQuery({
    queryKey: ['services', 'category-direct', category?._id, isSubcategory, cityKey],
    queryFn: async () => {
      if (isSubcategory) {
        const res = await serviceApi.list({ subCategoryId: category!._id, limit: 24, city: cityKey });
        return res.data.data;
      }
      const res = await serviceApi.list({ parentCategoryId: category!._id, limit: 24, city: cityKey });
      return res.data.data;
    },
    enabled: !!category?._id && !!city,
  });

  const { data: subcategoryServices = [] } = useQuery({
    queryKey: ['services', 'subcategory-rows', category?._id, children.map((c) => c._id), cityKey],
    queryFn: async () => {
      const rows = await Promise.all(
        children.map(async (sub) => {
          const res = await serviceApi.list({ subCategoryId: sub._id, limit: 8, city: cityKey });
          return { subcategory: sub, services: res.data.data };
        }),
      );
      return rows.filter((row) => row.services.length > 0);
    },
    enabled: !!category?._id && children.length > 0 && !!city,
  });

  const { data: relatedServices = [] } = useQuery({
    queryKey: ['services', 'related', category?._id, cityKey],
    queryFn: async () => {
      const parentId =
        typeof category!.parentId === 'object' && category!.parentId !== null
          ? (category!.parentId as { _id?: string })._id
          : category!.parentId;

      if (!parentId) return [];

      const allFlat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
      const parent = allFlat.find((c) => c._id === parentId);
      const siblings = parent?.children?.filter((c) => c._id !== category!._id) ?? [];

      const rows = await Promise.all(
        siblings.slice(0, 3).map(async (sib) => {
          const res = await serviceApi.list({ subCategoryId: sib._id, limit: 4, city: cityKey });
          return { subcategory: sib, services: res.data.data };
        }),
      );
      return rows.filter((row) => row.services.length > 0);
    },
    enabled: !!category?._id && isSubcategory && !!city,
  });

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        Category not found in {city?.name}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Categories', href: '/categories' }, { label: category.name }]} />
      <h1 className="mt-4 text-3xl font-bold">{category.name}</h1>
      {category.description && <p className="mt-2 text-slate-600">{category.description}</p>}
      <p className="mt-1 text-sm text-slate-500">Showing services available in {city?.name}</p>

      {children.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Subcategories</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {children.map((sub) => (
              <Link key={sub._id} href={`/categories/${sub.slug || sub._id}`}>
                <CategoryCard category={sub} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          {isSubcategory ? 'Services' : `Services in ${category.name}`}
        </h2>
        {directLoading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : directServices.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {directServices.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-slate-500">No services in this category for {city?.name} yet.</p>
        )}
      </section>

      {subcategoryServices.map(({ subcategory, services }) => (
        <section key={subcategory._id} className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{subcategory.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Related services in this subcategory</p>
            </div>
            <Link
              href={`/categories/${subcategory.slug || subcategory._id}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        </section>
      ))}

      {relatedServices.map(({ subcategory, services }) => (
        <section key={subcategory._id} className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{subcategory.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Related category services</p>
            </div>
            <Link
              href={`/categories/${subcategory.slug || subcategory._id}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <CityRequiredGate>
      <CategoryDetailCatalog slug={slug} />
    </CityRequiredGate>
  );
}
