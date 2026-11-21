import { describe, expect, it } from 'vitest';
import { orderItemRowSchema, orderRowSchema } from './seller-schemas';

const order = {
  id: 'o1',
  reference: 'SF-ABC234',
  status: 'awaiting_payment',
  buyer_name: 'Wanjiku',
  buyer_phone: '254712345678',
  delivery_method: 'pickup',
  delivery_note: null,
  currency_code: 'KES',
  subtotal_minor: 150000,
  delivery_fee_minor: 0,
  total_minor: 150000,
  expires_at: '2026-11-21T10:00:00Z',
  created_at: '2026-11-20T10:00:00Z',
};

describe('orderRowSchema', () => {
  it('accepts a good order', () => {
    expect(orderRowSchema.safeParse(order).success).toBe(true);
  });
  it('rejects an unknown status and a negative total', () => {
    expect(orderRowSchema.safeParse({ ...order, status: 'shipped' }).success).toBe(false);
    expect(orderRowSchema.safeParse({ ...order, total_minor: -1 }).success).toBe(false);
  });
  it('drops fields it does not know', () => {
    const parsed = orderRowSchema.parse({ ...order, shop_id: 'secret' });
    expect(JSON.stringify(parsed)).not.toMatch(/shop_id/);
  });
});

describe('orderItemRowSchema', () => {
  it('accepts a good item and rejects a zero quantity', () => {
    const item = {
      id: 'i1',
      product_name: 'Dress',
      variant_label: 'M / Red',
      quantity: 2,
      unit_price_minor: 150000,
    };
    expect(orderItemRowSchema.safeParse(item).success).toBe(true);
    expect(orderItemRowSchema.safeParse({ ...item, quantity: 0 }).success).toBe(false);
  });
});
