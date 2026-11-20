import { describe, expect, it } from 'vitest';
import { publicBrowseResultSchema } from './browse-schemas';

const good = {
  products: [
    {
      id: 'p1',
      name: 'Dress',
      category_code: 'clothes',
      price_minor: 150000,
      currency_code: 'KES',
      in_stock: true,
      cover: { id: 'i1', path: 'a/b/c.webp', thumb_path: 'a/b/c_t.webp', width: 800, height: 1200 },
      shop: { name: 'Alpha Shop', slug: 'alphashop' },
    },
  ],
};

describe('publicBrowseResultSchema', () => {
  it('accepts a good answer', () => {
    expect(publicBrowseResultSchema.safeParse(good).success).toBe(true);
  });

  it('accepts null and an empty list', () => {
    expect(publicBrowseResultSchema.safeParse(null).success).toBe(true);
    expect(publicBrowseResultSchema.safeParse({ products: [] }).success).toBe(true);
  });

  it('drops fields the page must never show', () => {
    const withExtra = structuredClone(good) as Record<string, unknown>;
    (withExtra.products as Record<string, unknown>[])[0].on_hand = 12;
    (withExtra.products as Record<string, unknown>[])[0].shop_id = 'secret';
    const parsed = publicBrowseResultSchema.parse(withExtra);
    expect(JSON.stringify(parsed)).not.toMatch(/on_hand|shop_id/);
  });

  it('rejects a cover with no size, because photos must show whole', () => {
    const broken = structuredClone(good);
    (broken.products[0].cover as Record<string, unknown>).height = 0;
    expect(publicBrowseResultSchema.safeParse(broken).success).toBe(false);
  });
});
