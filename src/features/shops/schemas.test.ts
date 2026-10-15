import { describe, expect, it } from 'vitest';
import { createShopSchema } from './schemas';

const valid = {
  name: 'Mama Njeri Fashion',
  slug: 'mama-njeri-fashion',
  countryCode: 'KE',
};

describe('createShopSchema', () => {
  it('accepts valid input', () => {
    expect(createShopSchema.safeParse(valid).success).toBe(true);
  });

  it('trims the shop name', () => {
    const result = createShopSchema.parse({ ...valid, name: '  Zuri Shoes  ' });
    expect(result.name).toBe('Zuri Shoes');
  });

  it('lowercases the link name', () => {
    const result = createShopSchema.parse({ ...valid, slug: 'Mama-Njeri' });
    expect(result.slug).toBe('mama-njeri');
  });

  it('rejects a shop name that is too short', () => {
    expect(createShopSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejects a shop name longer than 80 characters', () => {
    expect(createShopSchema.safeParse({ ...valid, name: 'a'.repeat(81) }).success).toBe(false);
  });

  it('rejects a link name with spaces or symbols', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: 'Bad Slug!' }).success).toBe(false);
  });

  it('rejects a link name shorter than 3 characters', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: 'ab' }).success).toBe(false);
  });

  it('rejects a link name with a double hyphen', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: 'a--b' }).success).toBe(false);
  });

  it('rejects a link name starting with a hyphen', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: '-abc' }).success).toBe(false);
  });

  it('rejects a link name longer than 40 characters', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: 'a'.repeat(41) }).success).toBe(false);
  });

  it('rejects a country code that is not two capital letters', () => {
    expect(createShopSchema.safeParse({ ...valid, countryCode: 'ke' }).success).toBe(false);
  });
});
