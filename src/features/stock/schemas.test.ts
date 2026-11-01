import { describe, expect, it } from 'vitest';
import { recordStockSchema, undoMovementSchema } from './schemas';

const id = '3f2b6c1e-8a4d-4c1e-9b7a-1d2e3f4a5b6c';
const valid = {
  slug: 'mama-njeri',
  productId: id,
  variantId: id,
  kind: 'restock',
  quantity: '5',
  note: '',
};

describe('recordStockSchema', () => {
  it('accepts a valid restock and turns the quantity into a number', () => {
    const result = recordStockSchema.parse(valid);
    expect(result.quantity).toBe(5);
  });

  it('accepts a damage record without a note', () => {
    expect(recordStockSchema.safeParse({ ...valid, kind: 'damage' }).success).toBe(true);
  });

  it('requires a note for count corrections', () => {
    expect(recordStockSchema.safeParse({ ...valid, kind: 'found' }).success).toBe(false);
    expect(recordStockSchema.safeParse({ ...valid, kind: 'lost', note: 'ab' }).success).toBe(false);
    expect(
      recordStockSchema.safeParse({ ...valid, kind: 'lost', note: 'Counted again' }).success,
    ).toBe(true);
  });

  it('rejects quantities that are not whole positive numbers', () => {
    for (const quantity of ['0', '-3', '2.5', 'abc', '', '1000000']) {
      expect(recordStockSchema.safeParse({ ...valid, quantity }).success).toBe(false);
    }
  });

  it('accepts the largest allowed quantity', () => {
    expect(recordStockSchema.safeParse({ ...valid, quantity: '100000' }).success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    expect(recordStockSchema.safeParse({ ...valid, kind: 'sale' }).success).toBe(false);
  });

  it('rejects ids that are not ids', () => {
    expect(recordStockSchema.safeParse({ ...valid, variantId: 'abc' }).success).toBe(false);
  });

  it('rejects a note longer than 200 characters', () => {
    expect(recordStockSchema.safeParse({ ...valid, note: 'a'.repeat(201) }).success).toBe(false);
  });
});

describe('undoMovementSchema', () => {
  it('accepts a valid request', () => {
    expect(
      undoMovementSchema.safeParse({ slug: 'mama-njeri', productId: id, movementId: id }).success,
    ).toBe(true);
  });

  it('rejects a movement id that is not an id', () => {
    expect(
      undoMovementSchema.safeParse({ slug: 'mama-njeri', productId: id, movementId: 'x' }).success,
    ).toBe(false);
  });
});
