import { describe, expect, it } from 'vitest';
import { buildVariantGrid, variantKey, variantLabel } from './variants';

describe('buildVariantGrid', () => {
  it('makes every combination of sizes and colours', () => {
    expect(buildVariantGrid(['M', 'L'], ['Red', 'Blue'])).toEqual([
      { size: 'M', colour: 'Red' },
      { size: 'M', colour: 'Blue' },
      { size: 'L', colour: 'Red' },
      { size: 'L', colour: 'Blue' },
    ]);
  });

  it('uses only sizes when there are no colours', () => {
    expect(buildVariantGrid(['S', 'M'], [])).toEqual([
      { size: 'S', colour: null },
      { size: 'M', colour: null },
    ]);
  });

  it('uses only colours when there are no sizes', () => {
    expect(buildVariantGrid([], ['Black'])).toEqual([{ size: null, colour: 'Black' }]);
  });

  it('makes one plain variant when nothing is chosen', () => {
    expect(buildVariantGrid([], [])).toEqual([{ size: null, colour: null }]);
  });

  it('trims values and ignores empty ones', () => {
    expect(buildVariantGrid(['  M ', '', '   '], [' Red '])).toEqual([
      { size: 'M', colour: 'Red' },
    ]);
  });

  it('removes repeats ignoring letter case and keeps the first spelling', () => {
    expect(buildVariantGrid(['M', ' m ', 'L'], ['red', 'RED'])).toEqual([
      { size: 'M', colour: 'red' },
      { size: 'L', colour: 'red' },
    ]);
  });
});

describe('variantKey', () => {
  it('ignores letter case and spaces around the values', () => {
    expect(variantKey(' M ', 'Red')).toBe('m|red');
  });

  it('keeps an empty size and an empty colour apart', () => {
    expect(variantKey(null, 'Red')).toBe('|red');
    expect(variantKey('Red', null)).toBe('red|');
  });
});

describe('variantLabel', () => {
  it('joins size and colour', () => {
    expect(variantLabel({ size: 'M', colour: 'Red' })).toBe('M, Red');
  });

  it('names a plain variant', () => {
    expect(variantLabel({ size: null, colour: null })).toBe('One size');
  });
});
