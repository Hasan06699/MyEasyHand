import type { ServiceCategory } from '@/types';

export function findCategoryBySlug(
  categories: ServiceCategory[],
  slug: string,
): ServiceCategory | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children?.length) {
      const found = findCategoryBySlug(cat.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}
