import { describe, expect, it } from 'vitest';
import { isOrderReference, normalizeReference } from './reference';

describe('normalizeReference', () => {
  it('trims and upper cases', () => {
    expect(normalizeReference('  sf-abc234 ')).toBe('SF-ABC234');
  });
});

describe('isOrderReference', () => {
  it('accepts a real looking reference in any case', () => {
    expect(isOrderReference('SF-ABC234')).toBe(true);
    expect(isOrderReference(' sf-abc234 ')).toBe(true);
  });
  it('rejects wrong lengths and letters that are never used', () => {
    for (const bad of [
      '',
      'SF-ABC23',
      'SF-ABC2345',
      'SF-ABCI34',
      'SF-ABCO34',
      'SF-ABC1L4',
      "SF-ABC234' or '1'='1",
      'XX-ABC234',
    ]) {
      expect(isOrderReference(bad)).toBe(false);
    }
  });
});
