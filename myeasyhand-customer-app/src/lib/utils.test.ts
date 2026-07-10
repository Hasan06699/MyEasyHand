jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiUrl: 'http://localhost:5050/api/v1' },
    },
  },
}));

import { formatPrice, getApiBaseUrl, getUserDisplayName } from './utils';

describe('utils', () => {
  it('getApiBaseUrl strips /api/v1 suffix', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:5050');
  });

  it('formatPrice formats INR', () => {
    expect(formatPrice(999)).toContain('999');
  });

  it('getUserDisplayName returns Guest when empty', () => {
    expect(getUserDisplayName()).toBe('Guest');
    expect(getUserDisplayName('Jane', 'Doe')).toBe('Jane Doe');
  });
});
