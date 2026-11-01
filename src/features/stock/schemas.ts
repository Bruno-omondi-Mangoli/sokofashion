import { z } from 'zod';
import { createShopSchema } from '@/features/shops/schemas';
import { kindNeedsNote, movementKindValues } from './movement';

const slug = createShopSchema.shape.slug;

/*
 * What the record stock form sends. The quantity arrives as text and must be a
 * whole number of at least 1. Count corrections need a short note, so there is
 * always a reason on record.
 */
export const recordStockSchema = z
  .object({
    slug,
    productId: z.uuid(),
    variantId: z.uuid(),
    kind: z.enum(movementKindValues, { error: 'Choose what happened' }),
    quantity: z
      .string()
      .trim()
      .regex(/^\d{1,6}$/, 'Enter a whole number, like 5')
      .transform((value) => Number(value))
      .pipe(z.number().int().min(1, 'Enter at least 1').max(100000, 'Enter at most 100000')),
    note: z.string().trim().max(200, 'The note can have at most 200 characters'),
  })
  .refine((value) => !kindNeedsNote(value.kind) || value.note.length >= 3, {
    message: 'Add a short note that explains the correction',
    path: ['note'],
  });

export const undoMovementSchema = z.object({
  slug,
  productId: z.uuid(),
  movementId: z.uuid(),
});
