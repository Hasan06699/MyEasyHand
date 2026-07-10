import Link from 'next/link';
import Image from 'next/image';
import type { ServiceCategory } from '@/types';
import { getMediaUrl } from '@/lib/utils';
import { Wrench } from 'lucide-react';

export function CategoryCard({ category }: { category: ServiceCategory }) {
  const href = `/categories/${category.slug || category._id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col items-center rounded-xl border bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
        {category.image || category.icon ? (
          <Image
            src={getMediaUrl(category.image || category.icon)}
            alt={category.name}
            width={48}
            height={48}
            className="object-cover"
          />
        ) : (
          <Wrench className="h-7 w-7" />
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{category.name}</h3>
      {category.children && category.children.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">{category.children.length} subcategories</p>
      )}
    </Link>
  );
}
