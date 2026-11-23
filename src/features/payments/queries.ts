import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { paymentRowSchema, type PaymentRow } from './schemas';

/* The payments of one order, newest first. Row security only lets team members read them. */
export async function getOrderPayments(
  supabase: SupabaseClient,
  orderId: string,
): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, mpesa_code, status, amount_minor, submitted_at, decided_at')
    .eq('order_id', orderId)
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('reading payments failed', error.code);
    throw new Error('The payments could not be loaded');
  }
  const parsed = z.array(paymentRowSchema).safeParse(data);
  if (!parsed.success) {
    console.error('payments had an unexpected shape');
    throw new Error('The payments could not be loaded');
  }
  return parsed.data;
}
