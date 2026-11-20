import { z } from 'zod';
import { PRODUCT_ID_PATTERN } from '@/features/storefront/picker';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';

export const MAX_QUANTITY = 10;
export const MAX_LINES_PER_SHOP = 20;
export const MAX_LINES_TOTAL = 100;

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const THUMB_PATH_PATTERN = new RegExp(`^${UUID}/${UUID}/${UUID}_t\\.(webp|jpg)$`);

/*
 * One line in the cart. Everything here is only for showing the cart. The
 * database decides prices and stock when an order is placed (Phase 7).
 */
export const cartLineSchema = z.object({
  shopSlug: z.string().regex(SHOP_LINK_PATTERN),
  shopName: z.string().min(1).max(120),
  productId: z.string().regex(PRODUCT_ID_PATTERN),
  productName: z.string().min(1).max(200),
  variantId: z.string().regex(PRODUCT_ID_PATTERN),
  variantLabel: z.string().min(1).max(200),
  priceMinor: z.number().int().min(0).max(100000000),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  minorUnits: z.number().int().min(0).max(4),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  thumbPath: z.string().regex(THUMB_PATH_PATTERN).nullable(),
  width: z.number().int().positive().max(5000).nullable(),
  height: z.number().int().positive().max(5000).nullable(),
});

/* The outer shape is checked first, then each line on its own, so one bad line never wipes the cart */
export const storedEnvelopeSchema = z.object({
  version: z.literal(1),
  lines: z.array(z.unknown()).max(MAX_LINES_TOTAL),
});

export type CartLine = z.infer<typeof cartLineSchema>;
