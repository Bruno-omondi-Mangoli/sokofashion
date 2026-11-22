import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  orderItemRowSchema,
  orderRowSchema,
  type OrderItemRow,
  type OrderRow,
} from './seller-schemas';
import type { OrderStatus } from './status';

const ORDER_COLUMNS =
  'id, reference, status, buyer_name, buyer_phone, delivery_method, delivery_note, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at, created_at';

/*
 * Gives back the stock of unpaid orders whose time ran out. Any team member may
 * ask, the database refuses everybody else. A failure is logged by code only and
 * never stops the page.
 */
export async function releaseExpiredOrders(
  supabase: SupabaseClient,
  shopId: string,
): Promise<void> {
  const { error } = await supabase.rpc('release_expired_orders', { target_shop_id: shopId });
  if (error) {
    console.error('release_expired_orders failed', error.code);
  }
}

/* The newest 100 orders of one shop. Row security only lets team members read them. */
export async function getShopOrders(
  supabase: SupabaseClient,
  shopId: string,
  status: OrderStatus | null,
): Promise<OrderRow[]> {
  let query = supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('reading orders failed', error.code);
    throw new Error('The orders could not be loaded');
  }
  const parsed = z.array(orderRowSchema).safeParse(data);
  if (!parsed.success) {
    console.error('orders had an unexpected shape');
    throw new Error('The orders could not be loaded');
  }
  return parsed.data;
}

/* One order with its items, only when it belongs to this shop */
export async function getOrderDetail(
  supabase: SupabaseClient,
  shopId: string,
  orderId: string,
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error) {
    console.error('reading an order failed', error.code);
    throw new Error('The order could not be loaded');
  }
  const order = orderRowSchema.safeParse(data);
  if (!order.success) {
    return null;
  }

  const { data: itemData, error: itemError } = await supabase
    .from('order_items')
    .select('id, product_name, variant_label, quantity, unit_price_minor')
    .eq('order_id', orderId)
    .order('product_name');
  if (itemError) {
    console.error('reading order items failed', itemError.code);
    throw new Error('The order could not be loaded');
  }
  const items = z.array(orderItemRowSchema).safeParse(itemData);
  if (!items.success) {
    console.error('order items had an unexpected shape');
    throw new Error('The order could not be loaded');
  }
  return { order: order.data, items: items.data };
}

/* How many unpaid orders are still inside their 24 hours. Row security only lets team members count them. */
export async function countWaitingOrders(
  supabase: SupabaseClient,
  shopId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'awaiting_payment')
    .gt('expires_at', new Date().toISOString());
  if (error) {
    console.error('counting orders failed', error.code);
    return 0;
  }
  return count ?? 0;
}
