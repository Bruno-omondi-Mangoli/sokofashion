import { z } from 'zod';
import { ORDER_STATUSES } from './status';

export const orderRowSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: z.enum(ORDER_STATUSES),
  buyer_name: z.string(),
  buyer_phone: z.string(),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_note: z.string().nullable(),
  currency_code: z.string(),
  subtotal_minor: z.number().int().nonnegative(),
  delivery_fee_minor: z.number().int().nonnegative(),
  total_minor: z.number().int().nonnegative(),
  expires_at: z.string(),
  created_at: z.string(),
});

export const orderItemRowSchema = z.object({
  id: z.string(),
  product_name: z.string(),
  variant_label: z.string(),
  quantity: z.number().int().positive(),
  unit_price_minor: z.number().int().nonnegative(),
});

export type OrderRow = z.infer<typeof orderRowSchema>;
export type OrderItemRow = z.infer<typeof orderItemRowSchema>;
