import { describe, expect, it } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formats INR without decimals', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
    expect(result).toMatch(/₹|INR/);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});
