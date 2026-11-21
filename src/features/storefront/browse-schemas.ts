import { z } from 'zod';

const coverSchema = z.object({
  id: z.string(),
  path: z.string(),
  thumb_path: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const browseProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category_code: z.string(),
  price_minor: z.number().int().nonnegative(),
  currency_code: z.string(),
  is_new: z.boolean(),
  in_stock: z.boolean(),
  cover: coverSchema.nullable(),
  shop: z.object({ name: z.string(), slug: z.string() }),
});

/* The function answers null for an offset outside the allowed range */
export const publicBrowseResultSchema = z
  .object({
    new_count: z.number().int().nonnegative(),
    products: z.array(browseProductSchema),
  })
  .nullable();

export type BrowseProduct = z.infer<typeof browseProductSchema>;
