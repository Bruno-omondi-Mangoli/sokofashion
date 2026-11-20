import { describe, expect, it } from 'vitest';
import {
  addLine,
  clearShop,
  countItems,
  groupByShop,
  parseStoredCart,
  removeLine,
  setQuantity,
} from './cart-logic';
import { MAX_LINES_PER_SHOP, MAX_QUANTITY, type CartLine } from './schemas';

const id = (n: number) => `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, '0')}`;

const line = (n: number, over: Partial<CartLine> = {}): CartLine => ({
  shopSlug: 'alphashop',
  shopName: 'Alpha Shop',
  productId: id(900),
  productName: 'Dress',
  variantId: id(n),
  variantLabel: 'M / Red',
  priceMinor: 150000,
  currencyCode: 'KES',
  minorUnits: 2,
  quantity: 1,
  thumbPath: null,
  width: null,
  height: null,
  ...over,
});

const stored = (lines: unknown[], version = 1) => JSON.stringify({ version, lines });

describe('addLine', () => {
  it('adds a new line', () => {
    const result = addLine([], line(1));
    expect(result.status).toBe('added');
    expect(result.lines).toHaveLength(1);
  });

  it('merges the same variant into one line', () => {
    const once = addLine([], line(1)).lines;
    const twice = addLine(once, line(1)).lines;
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
  });

  it('never goes above the quantity limit', () => {
    const first = addLine([], line(1, { quantity: MAX_QUANTITY })).lines;
    const second = addLine(first, line(1, { quantity: MAX_QUANTITY })).lines;
    expect(second[0].quantity).toBe(MAX_QUANTITY);
  });

  it('refuses a new line when the shop cart is full, but other shops still work', () => {
    let lines: CartLine[] = [];
    for (let n = 1; n <= MAX_LINES_PER_SHOP; n += 1) {
      lines = addLine(lines, line(n)).lines;
    }
    expect(lines).toHaveLength(MAX_LINES_PER_SHOP);
    const refused = addLine(lines, line(500));
    expect(refused.status).toBe('full');
    expect(refused.lines).toHaveLength(MAX_LINES_PER_SHOP);
    const other = addLine(lines, line(501, { shopSlug: 'betashop', shopName: 'Beta Shop' }));
    expect(other.status).toBe('added');
  });

  it('cuts names that are too long instead of breaking the cart', () => {
    const result = addLine([], line(1, { productName: 'x'.repeat(500) }));
    expect(result.lines[0].productName).toHaveLength(200);
  });
});

describe('setQuantity, removeLine, clearShop, countItems', () => {
  it('removes a line when the quantity is zero', () => {
    expect(setQuantity([line(1)], id(1), 0)).toEqual([]);
  });
  it('cuts a huge quantity to the limit', () => {
    expect(setQuantity([line(1)], id(1), 99)[0].quantity).toBe(MAX_QUANTITY);
  });
  it('sets a normal quantity', () => {
    expect(setQuantity([line(1)], id(1), 4)[0].quantity).toBe(4);
  });
  it('removes one line', () => {
    expect(removeLine([line(1), line(2)], id(1)).map((l) => l.variantId)).toEqual([id(2)]);
  });
  it('clears only one shop', () => {
    const lines = [line(1), line(2, { shopSlug: 'betashop' })];
    expect(clearShop(lines, 'alphashop').map((l) => l.shopSlug)).toEqual(['betashop']);
  });
  it('counts items, not lines', () => {
    expect(countItems([line(1, { quantity: 2 }), line(2, { quantity: 3 })])).toBe(5);
  });
});

describe('groupByShop', () => {
  it('makes one group per shop with the right subtotal', () => {
    const groups = groupByShop([
      line(1, { quantity: 2 }),
      line(2, { shopSlug: 'betashop', shopName: 'Beta Shop', priceMinor: 90000 }),
      line(3, { priceMinor: 100000 }),
    ]);
    expect(groups.map((g) => g.shopSlug)).toEqual(['alphashop', 'betashop']);
    expect(groups[0].subtotalMinor).toBe(2 * 150000 + 100000);
    expect(groups[1].subtotalMinor).toBe(90000);
  });
});

describe('parseStoredCart', () => {
  it('gives an empty cart for nothing or junk', () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart('not json')).toEqual([]);
    expect(parseStoredCart(stored([line(1)], 2))).toEqual([]);
  });

  it('reads a good cart', () => {
    expect(parseStoredCart(stored([line(1)]))).toEqual([line(1)]);
  });

  it('drops a tampered quantity but keeps the good lines', () => {
    const result = parseStoredCart(stored([line(1, { quantity: 999 }), line(2)]));
    expect(result.map((l) => l.variantId)).toEqual([id(2)]);
  });

  it('drops a line with a photo path that is not ours', () => {
    expect(parseStoredCart(stored([line(1, { thumbPath: '../../secret.jpg' })]))).toEqual([]);
  });

  it('drops a negative price and a bad link name', () => {
    expect(parseStoredCart(stored([line(1, { priceMinor: -5 })]))).toEqual([]);
    expect(parseStoredCart(stored([line(1, { shopSlug: "a' or '1'='1" })]))).toEqual([]);
  });

  it('keeps only one line per variant', () => {
    expect(parseStoredCart(stored([line(1), line(1)]))).toHaveLength(1);
  });
});
