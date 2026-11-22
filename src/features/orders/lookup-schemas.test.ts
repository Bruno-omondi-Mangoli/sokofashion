import { describe, expect, it } from 'vitest';
import { lookedUpOrderSchema, lookupInputSchema } from './lookup-schemas';

const order = {
  reference: 'SF-ABC234',
  status: 'awaiting_payment',
  shop: { name: 'Alpha Shop', slug: 'alphashop' },
  delivery_method: 'pickup',
  delivery_note: null,
  currency_code: 'KES',
  subtotal_minor: 150000,
  delivery_fee_minor: 0,
  total_minor: 150000,
  expires_at: '2026-11-22T10:00:00Z',
  created_at: '2026-11-21T10:00:00Z',
  items: [
    { product_name: 'Dress', variant_label: 'M / red', quantity: 1, unit_price_minor: 150000 },
  ],
};

describe('lookupInputSchema', () => {
  it('accepts a reference in any case and cleans it', () => {
    const parsed = lookupInputSchema.parse({ reference: ' sf-abc234 ', phone: '0712 345 678' });
    expect(parsed.reference).toBe('SF-ABC234');
  });
  it('rejects a bad reference and a short phone', () => {
    expect(lookupInputSchema.safeParse({ reference: 'hello', phone: '0712345678' }).success).toBe(
      false,
    );
    expect(lookupInputSchema.safeParse({ reference: 'SF-ABC234', phone: '123' }).success).toBe(
      false,
    );
  });
});

describe('lookedUpOrderSchema', () => {
  it('accepts a good answer and null', () => {
    expect(lookedUpOrderSchema.safeParse(order).success).toBe(true);
    expect(lookedUpOrderSchema.safeParse(null).success).toBe(true);
  });
  it('rejects an unknown status', () => {
    expect(lookedUpOrderSchema.safeParse({ ...order, status: 'shipped' }).success).toBe(false);
  });
  it('drops fields the page must never show', () => {
    const parsed = lookedUpOrderSchema.parse({
      ...order,
      buyer_phone: '254712345678',
      shop_id: 'x',
    });
    expect(JSON.stringify(parsed)).not.toMatch(/buyer_phone|shop_id/);
  });
});
