import { describe, expect, it } from 'vitest';
import { checkoutInfoSchema, placeOrderInputSchema } from './schemas';

const variant = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const good = {
  shopSlug: 'alphashop',
  name: 'Wanjiku Test',
  phone: '0712 345 678',
  method: 'pickup',
  items: [{ variantId: variant, quantity: 2 }],
};

describe('placeOrderInputSchema', () => {
  it('accepts a good order', () => {
    expect(placeOrderInputSchema.safeParse(good).success).toBe(true);
  });
  it('has nowhere to put a price or a fee', () => {
    const parsed = placeOrderInputSchema.parse({ ...good, priceMinor: 1, feeMinor: 0 });
    expect(JSON.stringify(parsed)).not.toMatch(/priceMinor|feeMinor/);
  });
  it('rejects bad input', () => {
    const bad = [
      { ...good, shopSlug: "a' or '1'='1" },
      { ...good, name: 'A' },
      { ...good, phone: '123' },
      { ...good, method: 'courier' },
      { ...good, items: [] },
      { ...good, items: [{ variantId: variant, quantity: 11 }] },
      { ...good, items: [{ variantId: 'not-an-id', quantity: 1 }] },
      { ...good, items: Array.from({ length: 21 }, () => ({ variantId: variant, quantity: 1 })) },
    ];
    for (const input of bad) {
      expect(placeOrderInputSchema.safeParse(input).success).toBe(false);
    }
  });
});

describe('checkoutInfoSchema', () => {
  it('accepts a good answer and null', () => {
    const info = {
      name: 'Alpha',
      slug: 'alphashop',
      currency_code: 'KES',
      delivery_mode: 'paid_delivery',
      delivery_fee_minor: 30000,
    };
    expect(checkoutInfoSchema.safeParse(info).success).toBe(true);
    expect(checkoutInfoSchema.safeParse(null).success).toBe(true);
  });
  it('rejects an unknown delivery mode', () => {
    expect(
      checkoutInfoSchema.safeParse({
        name: 'A',
        slug: 'a',
        currency_code: 'KES',
        delivery_mode: 'drone',
        delivery_fee_minor: 0,
      }).success,
    ).toBe(false);
  });
});
