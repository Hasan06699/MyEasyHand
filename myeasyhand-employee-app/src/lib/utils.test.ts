jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiUrl: 'http://localhost:5050/api/v1' },
    },
  },
}));

import { formatPrice, getUserDisplayName, isEmployeeRole } from './utils';

describe('utils', () => {
  it('formatPrice formats INR', () => {
    expect(formatPrice(500)).toContain('500');
  });

  it('getUserDisplayName defaults to Employee', () => {
    expect(getUserDisplayName()).toBe('Employee');
  });

  it('isEmployeeRole detects employee slug', () => {
    expect(isEmployeeRole(['employee'])).toBe(true);
    expect(isEmployeeRole(['customer'])).toBe(false);
  });
});
