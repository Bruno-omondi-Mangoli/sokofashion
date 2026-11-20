import { z } from 'zod';
import { PRODUCT_ID_PATTERN } from '@/features/storefront/picker';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';

/* What the checkout page may know about a shop, from get_public_checkout_info */
export const checkoutInfoSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    currency_code: z.string(),
    delivery_mode: z.enum(['pickup_only', 'free_delivery', 'paid_delivery']),
    delivery_fee_minor: z.number().int().nonnegative(),
  })
  .nullable();

export type CheckoutInfo = NonNullable<z.infer<typeof checkoutInfoSchema>>;

/* The answer of place_order. The database worked all of these out. */
export const placedOrderSchema = z.object({
  reference: z.string(),
  status: z.literal('awaiting_payment'),
  currency_code: z.string(),
  subtotal_minor: z.number().int().nonnegative(),
  delivery_fee_minor: z.number().int().nonnegative(),
  total_minor: z.number().int().nonnegative(),
  expires_at: z.string(),
});

export type PlacedOrder = z.infer<typeof placedOrderSchema>;

/*
 * What the browser may send. Only ids and quantities: no prices and no fees,
 * so there is nothing to forge. The database checks everything again.
 */
export const placeOrderInputSchema = z.object({
  shopSlug: z.string().regex(SHOP_LINK_PATTERN),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  method: z.enum(['pickup', 'delivery']),
  address: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().regex(PRODUCT_ID_PATTERN),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(20),
});
