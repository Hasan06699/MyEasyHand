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
      className="group flex flex-col items-center rounded-[1.5rem] bg-white p-5 text-center shadow-soft ring-1 ring-brand-blue/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-orange/40"
    >
      <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#E3F2FD] to-[#FFF3E0] ring-4 ring-white shadow-md transition-transform group-hover:scale-105">
        {category.image || category.icon ? (
          <Image
            src={getMediaUrl(category.image || category.icon)}
            alt={category.name}
            width={52}
            height={52}
            className="object-cover"
          />
        ) : (
          <Wrench className="h-7 w-7 text-brand-blue" />
        )}
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-brand-blue">{category.name}</h3>
      {category.children && category.children.length > 0 && (
        <p className="mt-1 text-[11px] font-medium text-brand-orange">
          {category.children.length} subcategories
        </p>
      )}
    </Link>
  );
}
