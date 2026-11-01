import { describe, expect, it } from 'vitest';
import { archiveProductSchema, updateProductSchema } from './manage-schemas';

const id = '3f2b6c1e-8a4d-4c1e-9b7a-1d2e3f4a5b6c';
const valid = {
  slug: 'mama-njeri',
  productId: id,
  name: 'Kitenge Dress',
  category: 'clothes',
  price: '3500',
  description: '',
};

describe('updateProductSchema', () => {
  it('accepts a valid edit', () => {
    expect(updateProductSchema.safeParse(valid).success).toBe(true);
  });

  it('trims the name and description', () => {
    const result = updateProductSchema.parse({ ...valid, name: ' Dress ', description: ' Nice ' });
    expect(result.name).toBe('Dress');
    expect(result.description).toBe('Nice');
  });

  it('rejects a name that is too short', () => {
    expect(updateProductSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejects an unknown category', () => {
    expect(updateProductSchema.safeParse({ ...valid, category: 'toys' }).success).toBe(false);
  });

  it('rejects an empty price', () => {
    expect(updateProductSchema.safeParse({ ...valid, price: ' ' }).success).toBe(false);
  });

  it('rejects a product id that is not an id', () => {
    expect(updateProductSchema.safeParse({ ...valid, productId: 'abc' }).success).toBe(false);
  });
});

describe('archiveProductSchema', () => {
  it('accepts archiving and restoring', () => {
    expect(
      archiveProductSchema.safeParse({ slug: 'mama-njeri', productId: id, archive: 'true' })
        .success,
    ).toBe(true);
    expect(
      archiveProductSchema.safeParse({ slug: 'mama-njeri', productId: id, archive: 'false' })
        .success,
    ).toBe(true);
  });

  it('rejects any other value', () => {
    expect(
      archiveProductSchema.safeParse({ slug: 'mama-njeri', productId: id, archive: 'maybe' })
        .success,
    ).toBe(false);
  });
});
