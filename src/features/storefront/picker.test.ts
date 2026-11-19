import { describe, expect, it } from 'vitest';
import {
  PRODUCT_ID_PATTERN,
  defaultSelection,
  dimensionsUsed,
  findVariant,
  optionsFor,
} from './picker';
import type { PublicVariant } from './schemas';

const v = (over: Partial<PublicVariant>): PublicVariant => ({
  id: 'v',
  size: null,
  colour: null,
  shade: null,
  volume_ml: null,
  price_minor: 100,
  in_stock: true,
  ...over,
});

const list = [
  v({ id: '1', size: 'S', colour: 'Red', in_stock: false }),
  v({ id: '2', size: 'S', colour: 'Blue' }),
  v({ id: '3', size: 'M', colour: 'Red' }),
];

describe('dimensionsUsed', () => {
  it('lists only the choices that exist', () => {
    expect(dimensionsUsed(list)).toEqual(['size', 'colour']);
    expect(dimensionsUsed([v({ colour: 'Brown' })])).toEqual(['colour']);
    expect(dimensionsUsed([v({ shade: 'Rose' })])).toEqual(['shade']);
  });
});

describe('optionsFor', () => {
  it('lists each value once, in order', () => {
    expect(optionsFor(list, 'size')).toEqual(['S', 'M']);
    expect(optionsFor(list, 'colour')).toEqual(['Red', 'Blue']);
  });
});

describe('defaultSelection', () => {
  it('starts on the first variant that is in stock', () => {
    expect(defaultSelection(list)).toEqual({ size: 'S', colour: 'Blue' });
  });
  it('falls back to the first variant when everything is sold out', () => {
    expect(defaultSelection([v({ size: 'M', in_stock: false })])).toEqual({ size: 'M' });
  });
  it('gives an empty selection when there are no variants', () => {
    expect(defaultSelection([])).toEqual({});
  });
});

describe('findVariant', () => {
  it('finds an existing combination', () => {
    expect(findVariant(list, { size: 'M', colour: 'Red' })?.id).toBe('3');
  });
  it('returns null for a combination that does not exist', () => {
    expect(findVariant(list, { size: 'M', colour: 'Blue' })).toBeNull();
  });
});

describe('PRODUCT_ID_PATTERN', () => {
  it('accepts an id and rejects anything else', () => {
    expect(PRODUCT_ID_PATTERN.test('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')).toBe(true);
    for (const bad of [
      '',
      'abc',
      "x' or '1'='1",
      '../../etc',
      'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBB1',
    ]) {
      expect(PRODUCT_ID_PATTERN.test(bad)).toBe(false);
    }
  });
});
