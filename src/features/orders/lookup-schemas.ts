import { z } from 'zod';
import { ORDER_REFERENCE_PATTERN, normalizeReference } from './reference';
import { ORDER_STATUSES } from './status';

/* What the browser may send: only the two things the buyer typed */
export const lookupInputSchema = z.object({
  reference: z
    .string()
    .max(40)
    .transform(normalizeReference)
    .pipe(z.string().regex(ORDER_REFERENCE_PATTERN)),
  phone: z.string().trim().min(7).max(20),
});

/* What lookup_order may answer. The function gives null for every wrong guess. */
export const lookedUpOrderSchema = z
  .object({
    reference: z.string(),
    status: z.enum(ORDER_STATUSES),
    payment_status: z.enum(['pending', 'confirmed', 'rejected']).nullable(),
    shop: z.object({ name: z.string(), slug: z.string() }),
    delivery_method: z.enum(['pickup', 'delivery']),
    delivery_note: z.string().nullable(),
    currency_code: z.string(),
    subtotal_minor: z.number().int().nonnegative(),
    delivery_fee_minor: z.number().int().nonnegative(),
    total_minor: z.number().int().nonnegative(),
    expires_at: z.string(),
    created_at: z.string(),
    items: z.array(
      z.object({
        product_name: z.string(),
        variant_label: z.string(),
        quantity: z.number().int().positive(),
        unit_price_minor: z.number().int().nonnegative(),
      }),
    ),
  })
  .nullable();

export type LookedUpOrder = NonNullable<z.infer<typeof lookedUpOrderSchema>>;
