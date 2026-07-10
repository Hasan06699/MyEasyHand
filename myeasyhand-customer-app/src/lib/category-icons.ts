import type { Feather } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Feather>['name'];

const SLUG_ICON_MAP: Record<string, IconName> = {
  cleaning: 'droplet',
  repair: 'tool',
  plumbing: 'droplet',
  electrical: 'zap',
  beauty: 'star',
  salon: 'scissors',
  health: 'heart',
  fitness: 'activity',
  pest: 'shield',
  painting: 'edit-3',
  carpentry: 'box',
  appliance: 'cpu',
  moving: 'truck',
  garden: 'sun',
  car: 'truck',
  education: 'book-open',
  event: 'calendar',
  photography: 'camera',
  laundry: 'shopping-bag',
};

export function getCategoryIconName(slug?: string, name?: string): IconName {
  const key = (slug || name || '').toLowerCase();
  for (const [part, icon] of Object.entries(SLUG_ICON_MAP)) {
    if (key.includes(part)) return icon;
  }
  return 'grid';
}
