import { describe, expect, it } from 'vitest';
import { toMinorUnits } from './money';
import { toPriceText } from './price-text';

describe('toPriceText', () => {
  it('shows whole amounts without decimals', () => {
    expect(toPriceText(350000, 2)).toBe('3500');
  });

  it('shows cents when there are some', () => {
    expect(toPriceText(150050, 2)).toBe('1500.50');
    expect(toPriceText(5, 2)).toBe('0.05');
  });

  it('shows zero', () => {
    expect(toPriceText(0, 2)).toBe('0');
  });

  it('works for a currency with no decimals', () => {
    expect(toPriceText(5000, 0)).toBe('5000');
  });

  it('converts back to the same number', () => {
    for (const minor of [0, 5, 99, 100, 150050, 350000, 100000000]) {
      expect(toMinorUnits(toPriceText(minor, 2), 2)).toBe(minor);
    }
  });
});
