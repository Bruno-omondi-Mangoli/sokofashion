import { z } from 'zod';
import { createShopSchema } from '@/features/shops/schemas';

const sizeText = z.string().trim().min(1).max(20, 'Each size must be at most 20 characters');
const colourText = z.string().trim().min(1).max(30, 'Each colour must be at most 30 characters');

/*
 * Everything the add product form sends, as one JSON value. The server checks
 * all of it again, because the form can be bypassed. Stock is keyed by variant.
 */
export const createProductPayloadSchema = z.object({
  shopId: z.uuid(),
  slug: createShopSchema.shape.slug,
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(120, 'Product name must be at most 120 characters'),
  category: z.enum(['clothes', 'shoes', 'bags', 'cosmetics'], {
    error: 'Choose a category',
  }),
  price: z.string().trim().min(1, 'Enter a price'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
  sizes: z.array(sizeText).max(20, 'Choose at most 20 sizes'),
  colours: z.array(colourText).max(20, 'Choose at most 20 colours'),
  stock: z.record(z.string(), z.number().int().min(0).max(100000, 'Stock must be at most 100000')),
});
