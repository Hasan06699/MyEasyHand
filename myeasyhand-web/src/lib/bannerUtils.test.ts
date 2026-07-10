import { describe, expect, it } from 'vitest';
import { normalizeTextPosition } from './bannerUtils';

describe('normalizeTextPosition', () => {
  it('maps legacy left to center-left', () => {
    expect(normalizeTextPosition('left')).toBe('center-left');
  });

  it('maps legacy right to center-right', () => {
    expect(normalizeTextPosition('right')).toBe('center-right');
  });

  it('returns center-left for invalid values', () => {
    expect(normalizeTextPosition('invalid')).toBe('center-left');
    expect(normalizeTextPosition(undefined)).toBe('center-left');
  });

  it('preserves valid positions', () => {
    expect(normalizeTextPosition('top-center')).toBe('top-center');
    expect(normalizeTextPosition('bottom-right')).toBe('bottom-right');
  });
});
