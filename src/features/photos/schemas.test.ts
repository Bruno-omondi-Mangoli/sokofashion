import { describe, expect, it } from 'vitest';
import { productStatusSchema, registerPhotoSchema, removePhotoSchema } from './schemas';

const id = '3f2b6c1e-8a4d-4c1e-9b7a-1d2e3f4a5b6c';
const validRegister = {
  slug: 'mama-njeri',
  productId: id,
  imageId: id,
  extension: 'webp',
  width: 1200,
  height: 900,
};

describe('registerPhotoSchema', () => {
  it('accepts a valid registration', () => {
    expect(registerPhotoSchema.safeParse(validRegister).success).toBe(true);
  });

  it('accepts jpg', () => {
    expect(registerPhotoSchema.safeParse({ ...validRegister, extension: 'jpg' }).success).toBe(
      true,
    );
  });

  it('rejects any other file type', () => {
    expect(registerPhotoSchema.safeParse({ ...validRegister, extension: 'png' }).success).toBe(
      false,
    );
  });

  it('rejects ids that are not ids', () => {
    expect(registerPhotoSchema.safeParse({ ...validRegister, imageId: '../etc' }).success).toBe(
      false,
    );
  });

  it('rejects sizes that are zero, fractional or too large', () => {
    expect(registerPhotoSchema.safeParse({ ...validRegister, width: 0 }).success).toBe(false);
    expect(registerPhotoSchema.safeParse({ ...validRegister, height: 10.5 }).success).toBe(false);
    expect(registerPhotoSchema.safeParse({ ...validRegister, width: 4001 }).success).toBe(false);
  });
});

describe('removePhotoSchema', () => {
  it('accepts a valid removal', () => {
    expect(removePhotoSchema.safeParse({ slug: 'mama-njeri', imageId: id }).success).toBe(true);
  });

  it('rejects an image id that is not an id', () => {
    expect(removePhotoSchema.safeParse({ slug: 'mama-njeri', imageId: 'abc' }).success).toBe(false);
  });
});

describe('productStatusSchema', () => {
  it('accepts going live and hiding', () => {
    expect(
      productStatusSchema.safeParse({ slug: 'mama-njeri', productId: id, status: 'active' })
        .success,
    ).toBe(true);
    expect(
      productStatusSchema.safeParse({ slug: 'mama-njeri', productId: id, status: 'draft' }).success,
    ).toBe(true);
  });

  it('does not allow archiving from this form', () => {
    expect(
      productStatusSchema.safeParse({ slug: 'mama-njeri', productId: id, status: 'archived' })
        .success,
    ).toBe(false);
  });
});
