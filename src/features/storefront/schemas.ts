import { z } from 'zod';

const imageSchema = z.object({
  id: z.string(),
  path: z.string(),
  thumb_path: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const variantSchema = z.object({
  id: z.string(),
  size: z.string().nullable(),
  colour: z.string().nullable(),
  shade: z.string().nullable(),
  volume_ml: z.number().int().nullable(),
  price_minor: z.number().int().nonnegative(),
  in_stock: z.boolean(),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category_code: z.string(),
  price_minor: z.number().int().nonnegative(),
  currency_code: z.string(),
  images: z.array(imageSchema),
  variants: z.array(variantSchema),
});

export const publicShopSchema = z.object({
  name: z.string(),
  slug: z.string(),
  currency_code: z.string(),
  products: z.array(productSchema),
});

/* The function answers null for a missing or suspended shop */
export const publicShopResultSchema = publicShopSchema.nullable();

export const currencyUnitsSchema = z.object({
  currency_minor_units: z.number().int().min(0).max(4),
});

export type PublicShop = z.infer<typeof publicShopSchema>;
export type PublicProduct = z.infer<typeof productSchema>;
export type PublicVariant = z.infer<typeof variantSchema>;
export type PublicImage = z.infer<typeof imageSchema>;

/* One live product with the shop it belongs to, as returned by get_public_product */
export const publicProductResultSchema = z
  .object({
    shop: z.object({ name: z.string(), slug: z.string() }),
    product: productSchema,
  })
  .nullable();

export type PublicProductResult = NonNullable<z.infer<typeof publicProductResultSchema>>;
