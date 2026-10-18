import { describe, expect, it } from 'vitest';
import { formatMoney, toMinorUnits } from './money';

describe('toMinorUnits', () => {
  it('converts whole shillings', () => {
    expect(toMinorUnits('3500', 2)).toBe(350000);
  });

  it('accepts thousands separators and spaces', () => {
    expect(toMinorUnits('3,500', 2)).toBe(350000);
    expect(toMinorUnits(' 2 500 ', 2)).toBe(250000);
  });

  it('converts cents without rounding errors', () => {
    expect(toMinorUnits('1500.5', 2)).toBe(150050);
    expect(toMinorUnits('1500.50', 2)).toBe(150050);
    expect(toMinorUnits('0.05', 2)).toBe(5);
  });

  it('accepts zero', () => {
    expect(toMinorUnits('0', 2)).toBe(0);
  });

  it('refuses more decimals than the currency allows', () => {
    expect(toMinorUnits('12.345', 2)).toBeNull();
    expect(toMinorUnits('5000.5', 0)).toBeNull();
  });

  it('works for a currency with no decimals', () => {
    expect(toMinorUnits('5000', 0)).toBe(5000);
  });

  it('refuses empty, negative and non numeric input', () => {
    expect(toMinorUnits('', 2)).toBeNull();
    expect(toMinorUnits('-5', 2)).toBeNull();
    expect(toMinorUnits('abc', 2)).toBeNull();
    expect(toMinorUnits('1e3', 2)).toBeNull();
  });

  it('refuses a decimal point with no digits on one side', () => {
    expect(toMinorUnits('.5', 2)).toBeNull();
    expect(toMinorUnits('5.', 2)).toBeNull();
  });

  it('accepts the highest allowed price and refuses one above it', () => {
    expect(toMinorUnits('1000000', 2)).toBe(100000000);
    expect(toMinorUnits('1000001', 2)).toBeNull();
  });
});

describe('formatMoney', () => {
  it('shows whole amounts without decimals', () => {
    expect(formatMoney(350000, 'KES', 2)).toBe('KES 3,500');
  });

  it('shows cents when there are some', () => {
    expect(formatMoney(150050, 'KES', 2)).toBe('KES 1,500.50');
    expect(formatMoney(5, 'KES', 2)).toBe('KES 0.05');
  });

  it('shows zero', () => {
    expect(formatMoney(0, 'KES', 2)).toBe('KES 0');
  });

  it('groups millions', () => {
    expect(formatMoney(100000000, 'KES', 2)).toBe('KES 1,000,000');
  });

  it('works for a currency with no decimals', () => {
    expect(formatMoney(5000, 'UGX', 0)).toBe('UGX 5,000');
  });
});
