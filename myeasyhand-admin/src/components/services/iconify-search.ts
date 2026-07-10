import type { IconLibrary, ServiceIconOption } from './service-icons';

const LIBRARY_PREFIX: Partial<Record<Exclude<IconLibrary, 'all'>, string>> = {
  solar: 'solar',
  hugeicons: 'hugeicons',
  mdi: 'mdi',
  lucide: 'lucide',
  tabler: 'tabler',
  phosphor: 'ph',
};

export function getLibraryFromIcon(icon: string): Exclude<IconLibrary, 'all'> {
  const prefix = icon.split(':')[0];
  if (prefix === 'ph') return 'phosphor';
  if (prefix === 'solar') return 'solar';
  if (prefix === 'hugeicons') return 'hugeicons';
  if (prefix === 'mdi') return 'mdi';
  if (prefix === 'lucide') return 'lucide';
  if (prefix === 'tabler') return 'tabler';
  return 'solar';
}

function iconLabel(icon: string): string {
  const name = icon.split(':')[1] ?? icon;
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function searchIconifyIcons(
  query: string,
  library: IconLibrary,
  signal?: AbortSignal,
): Promise<ServiceIconOption[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({ query: q, limit: '72' });
  const prefix = library !== 'all' ? LIBRARY_PREFIX[library] : undefined;
  if (prefix) params.set('prefix', prefix);

  const res = await fetch(`https://api.iconify.design/search?${params.toString()}`, { signal });
  if (!res.ok) return [];

  const data = (await res.json()) as { icons?: string[] };
  return (data.icons ?? []).map((icon) => ({
    icon,
    label: iconLabel(icon),
    category: 'other',
    library: getLibraryFromIcon(icon),
  }));
}
