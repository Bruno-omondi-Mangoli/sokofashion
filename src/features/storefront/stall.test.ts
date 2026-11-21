import { describe, expect, it } from 'vitest';
import type { PublicVariant } from './schemas';
import { STALL_TONES, stallTone, threadKey, uniqueColours } from './stall';

const variant = (colour: string | null): PublicVariant => ({
  id: 'v',
  size: null,
  colour,
  shade: null,
  volume_ml: null,
  price_minor: 100,
  in_stock: true,
});

describe('stallTone', () => {
  it('gives the same colour for the same shop every time', () => {
    expect(stallTone('mama-njeri')).toBe(stallTone('mama-njeri'));
  });
  it('always gives one of the four kanga colours', () => {
    for (const slug of ['a', 'mama-njeri', 'zuri-shoes', 'x'.repeat(60)]) {
      expect(STALL_TONES).toContain(stallTone(slug));
    }
  });
  it('uses all four colours across many shops', () => {
    const used = new Set(Array.from({ length: 200 }, (_, index) => stallTone(`shop-${index}`)));
    expect(used.size).toBe(4);
  });
});

describe('threadKey', () => {
  it('finds the colour family of a name', () => {
    expect(threadKey('Red')).toBe('red');
    expect(threadKey('Burgundy')).toBe('red');
    expect(threadKey('NAVY blue')).toBe('blue');
    expect(threadKey('Black')).toBe('black');
  });
  it('gives the neutral dot for unknown or hostile text', () => {
    expect(threadKey('Zebra')).toBe('other');
    expect(threadKey('red; background:url(x)')).toBe('red');
    expect(threadKey('')).toBe('other');
  });
});

describe('uniqueColours', () => {
  it('lists each colour once, in order, ignoring case and empty values', () => {
    const colours = uniqueColours([variant('Red'), variant('red'), variant(null), variant('Blue')]);
    expect(colours.map((colour) => colour.label)).toEqual(['Red', 'Blue']);
  });
  it('is empty when no variant has a colour', () => {
    expect(uniqueColours([variant(null)])).toEqual([]);
  });
});
