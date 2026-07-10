import { ServiceRowSpacingByViewport, ServiceRowSpacingSides } from '@/lib/api';

export const DEFAULT_MARGIN: ServiceRowSpacingSides = { top: 0, bottom: 0, left: 0, right: 0 };
export const DEFAULT_PADDING: ServiceRowSpacingSides = { top: 16, bottom: 16, left: 16, right: 16 };

export function emptySpacingByViewport(defaults: ServiceRowSpacingSides): ServiceRowSpacingByViewport {
  return {
    web: { ...defaults },
    mobile: { ...defaults },
  };
}

export function normalizeSpacingByViewport(
  value: ServiceRowSpacingByViewport | ServiceRowSpacingSides | undefined,
  defaults: ServiceRowSpacingSides,
): ServiceRowSpacingByViewport {
  if (!value) return emptySpacingByViewport(defaults);
  if ('web' in value && value.web) {
    return {
      web: { ...defaults, ...value.web },
      mobile: { ...defaults, ...(value.mobile ?? value.web) },
    };
  }
  const flat = value as ServiceRowSpacingSides;
  return {
    web: { ...defaults, ...flat },
    mobile: { ...defaults, ...flat },
  };
}

export function resolveSpacingSides(
  value: ServiceRowSpacingByViewport | ServiceRowSpacingSides | undefined,
  viewport: 'web' | 'mobile',
  defaults: ServiceRowSpacingSides,
): ServiceRowSpacingSides {
  return normalizeSpacingByViewport(value, defaults)[viewport];
}
