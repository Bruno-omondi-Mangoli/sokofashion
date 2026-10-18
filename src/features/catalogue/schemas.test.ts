import { describe, expect, it } from 'vitest';
import { createProductPayloadSchema } from './schemas';

const valid = {
  shopId: '3f2b6c1e-8a4d-4c1e-9b7a-1d2e3f4a5b6c',
  slug: 'mama-njeri',
  name: 'Kitenge Dress',
  category: 'clothes',
  price: '3500',
  description: '',
  sizes: ['M', 'L'],
  colours: ['Red'],
  stock: { 'm|red': 5, 'l|red': 3 },
};

describe('createProductPayloadSchema', () => {
  it('accepts a valid payload', () => {
    expect(createProductPayloadSchema.safeParse(valid).success).toBe(true);
  });

  it('trims the name and the description', () => {
    const result = createProductPayloadSchema.parse({
      ...valid,
      name: '  Kitenge Dress ',
      description: '  Bright  ',
    });
    expect(result.name).toBe('Kitenge Dress');
    expect(result.description).toBe('Bright');
  });

  it('rejects a name that is too short', () => {
    expect(createProductPayloadSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejects a category that is not on the list', () => {
    expect(createProductPayloadSchema.safeParse({ ...valid, category: 'toys' }).success).toBe(
      false,
    );
  });

  it('rejects a shop id that is not an id', () => {
    expect(createProductPayloadSchema.safeParse({ ...valid, shopId: 'abc' }).success).toBe(false);
  });

  it('rejects an empty price', () => {
    expect(createProductPayloadSchema.safeParse({ ...valid, price: '  ' }).success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    const result = createProductPayloadSchema.safeParse({
      ...valid,
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 20 sizes', () => {
    const sizes = Array.from({ length: 21 }, (_, index) => `S${index}`);
    expect(createProductPayloadSchema.safeParse({ ...valid, sizes }).success).toBe(false);
  });

  it('rejects a negative or fractional stock number', () => {
    expect(createProductPayloadSchema.safeParse({ ...valid, stock: { 'm|red': -1 } }).success).toBe(
      false,
    );
    expect(
      createProductPayloadSchema.safeParse({
        ...valid,
        stock: { 'm|red': 2.5 },
      }).success,
    ).toBe(false);
  });

  it('rejects a stock number above 100000', () => {
    expect(
      createProductPayloadSchema.safeParse({
        ...valid,
        stock: { 'm|red': 100001 },
      }).success,
    ).toBe(false);
  });
});
