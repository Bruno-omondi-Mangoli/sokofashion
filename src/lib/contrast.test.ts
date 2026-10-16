import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb } from './contrast';

describe('hexToRgb', () => {
  it('reads a lowercase hex colour', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0]);
  });

  it('reads an uppercase hex colour', () => {
    expect(hexToRgb('#FF8000')).toEqual([255, 128, 0]);
  });

  it('refuses a colour that is not six hex digits', () => {
    expect(() => hexToRgb('#fff')).toThrow(/six digit/);
  });
});

describe('contrastRatio', () => {
  it('gives 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('gives 1 for the same colour twice', () => {
    expect(contrastRatio('#2a2e7a', '#2a2e7a')).toBeCloseTo(1, 5);
  });

  it('gives the same answer in either order', () => {
    expect(contrastRatio('#2a2e7a', '#fbfaf7')).toBeCloseTo(contrastRatio('#fbfaf7', '#2a2e7a'), 8);
  });

  it('matches the well known boundary grey on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});
