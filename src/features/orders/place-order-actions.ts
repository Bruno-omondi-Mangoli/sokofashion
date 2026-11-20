'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { orderErrorMessage } from './errors';
import { placeOrderInputSchema, placedOrderSchema } from './schemas';
import type { PlaceOrderResponse } from './types';

/*
 * Sends an order to the database. This only asks. place_order decides prices,
 * the delivery fee, stock and whether the shop is open, and it refuses the rest.
 * Only error codes are logged, never names, phones or addresses.
 */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResponse> {
  const parsed = placeOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: orderErrorMessage('22023') };
  }
  const { shopSlug, name, phone, method, address, items } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('place_order', {
    target_shop_slug: shopSlug,
    customer_name: name,
    customer_phone: phone,
    delivery_choice: method,
    delivery_address: address && address.length > 0 ? address : null,
    item_list: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
  });

  if (error) {
    console.error('place_order failed', error.code);
    return { ok: false, message: orderErrorMessage(error.code) };
  }

  const order = placedOrderSchema.safeParse(data);
  if (!order.success) {
    console.error('place_order returned an unexpected shape');
    return { ok: false, message: orderErrorMessage(undefined) };
  }
  return { ok: true, order: order.data };
}
