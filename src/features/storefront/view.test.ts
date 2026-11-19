import { describe, expect, it } from 'vitest';
import type { PublicVariant } from './schemas';
import {
  SHOP_LINK_PATTERN,
  buildPhotoViews,
  pageToOffset,
  productInStock,
  variantLabel,
} from './view';

const variant = (over: Partial<PublicVariant>): PublicVariant => ({
  id: 'v',
  size: null,
  colour: null,
  shade: null,
  volume_ml: null,
  price_minor: 100,
  in_stock: true,
  ...over,
});

describe('variantLabel', () => {
  it('joins size and colour', () => {
    expect(variantLabel(variant({ size: 'M', colour: 'Red' }))).toBe('M / Red');
  });
  it('shows shade and volume for cosmetics', () => {
    expect(variantLabel(variant({ shade: 'Rose', volume_ml: 50 }))).toBe('Rose / 50 ml');
  });
  it('falls back to Standard', () => {
    expect(variantLabel(variant({}))).toBe('Standard');
  });
});

describe('productInStock', () => {
  it('is true when any variant has stock', () => {
    expect(productInStock([variant({ in_stock: false }), variant({ in_stock: true })])).toBe(true);
  });
  it('is false when every variant is sold out', () => {
    expect(productInStock([variant({ in_stock: false })])).toBe(false);
  });
});

describe('buildPhotoViews', () => {
  it('keeps the real width and height and builds both addresses', () => {
    const views = buildPhotoViews(
      [{ id: 'i', path: 'a/b/c.jpg', thumb_path: 'a/b/c_t.jpg', width: 800, height: 1200 }],
      (path) => `https://x.test/${path}`,
    );
    expect(views).toEqual([
      {
        id: 'i',
        thumbUrl: 'https://x.test/a/b/c_t.jpg',
        mainUrl: 'https://x.test/a/b/c.jpg',
        width: 800,
        height: 1200,
      },
    ]);
  });
});

describe('pageToOffset', () => {
  it('starts at page 1', () => {
    expect(pageToOffset(undefined)).toEqual({ page: 1, offset: 0 });
  });
  it('turns page 3 into offset 96', () => {
    expect(pageToOffset('3')).toEqual({ page: 3, offset: 96 });
  });
  it('clamps nonsense', () => {
    expect(pageToOffset('-5').page).toBe(1);
    expect(pageToOffset('abc').page).toBe(1);
    expect(pageToOffset('99999999').page).toBe(2000);
  });
});

describe('SHOP_LINK_PATTERN', () => {
  it('accepts normal link names', () => {
    expect(SHOP_LINK_PATTERN.test('mama-njeri')).toBe(true);
  });
  it('rejects quotes, slashes, spaces, capitals and long names', () => {
    for (const bad of ["a' or '1'='1", 'a/b', 'a b', 'ABC', '', 'a'.repeat(61)]) {
      expect(SHOP_LINK_PATTERN.test(bad)).toBe(false);
    }
  });
});
