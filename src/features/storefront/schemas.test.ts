import { describe, expect, it } from 'vitest';
import { publicShopResultSchema } from './schemas';

const good = {
  name: 'Alpha Shop',
  slug: 'alphashop',
  currency_code: 'KES',
  about: null,
  new_count: 0,
  products: [
    {
      id: 'p1',
      name: 'Dress',
      description: null,
      category_code: 'clothes',
      price_minor: 150000,
      currency_code: 'KES',
      is_new: false,
      images: [
        { id: 'i1', path: 'a/b/c.webp', thumb_path: 'a/b/c_t.webp', width: 800, height: 1200 },
      ],
      variants: [
        {
          id: 'v1',
          size: 'M',
          colour: 'Red',
          shade: null,
          volume_ml: null,
          price_minor: 150000,
          in_stock: true,
        },
      ],
    },
  ],
};

describe('publicShopResultSchema', () => {
  it('accepts a good answer', () => {
    expect(publicShopResultSchema.safeParse(good).success).toBe(true);
  });

  it('accepts null for a missing shop', () => {
    expect(publicShopResultSchema.safeParse(null).success).toBe(true);
  });

  it('accepts an About text', () => {
    expect(publicShopResultSchema.safeParse({ ...good, about: 'We sell dresses.' }).success).toBe(
      true,
    );
  });

  it('drops fields the page must never show', () => {
    const withExtra = structuredClone(good) as Record<string, unknown>;
    (withExtra.products as Record<string, unknown>[])[0].on_hand = 12;
    (withExtra.products as Record<string, unknown>[])[0].shop_id = 'secret';
    const parsed = publicShopResultSchema.parse(withExtra);
    expect(JSON.stringify(parsed)).not.toMatch(/on_hand|shop_id/);
  });

  it('rejects a photo with no size, because photos must show whole', () => {
    const broken = structuredClone(good);
    (broken.products[0].images[0] as Record<string, unknown>).width = 0;
    expect(publicShopResultSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects an answer without the new arrivals fields', () => {
    const { new_count: _removed, ...withoutCount } = good;
    expect(publicShopResultSchema.safeParse(withoutCount).success).toBe(false);
  });

  it('rejects a wrong shape', () => {
    expect(publicShopResultSchema.safeParse({ name: 5 }).success).toBe(false);
  });
});
