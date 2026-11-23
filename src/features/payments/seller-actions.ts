'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { toMinorUnits } from '@/features/catalogue/money';
import { PRODUCT_ID_PATTERN } from '@/features/storefront/picker';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const targetSchema = z.object({
  paymentId: z.string().uuid(),
  orderId: z.string().regex(PRODUCT_ID_PATTERN),
  slug: z.string().regex(SHOP_LINK_PATTERN),
});

const currencyRowSchema = z.object({ currency_code: z.string() });

function back(slug: string, orderId: string, result: string): string {
  return `/dashboard/orders/${slug}/${orderId}?${result}`;
}

/*
 * Confirms a payment. The team member types the amount from their M-Pesa message.
 * This only asks. confirm_payment decides, and it marks the order paid only when
 * the amount equals the order total.
 */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  const parsed = targetSchema.safeParse({
    paymentId: formData.get('paymentId'),
    orderId: formData.get('orderId'),
    slug: formData.get('slug'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { paymentId, orderId, slug } = parsed.data;
  const amountText = String(formData.get('amount') ?? '').slice(0, 20);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { data: orderRow } = await supabase
    .from('orders')
    .select('currency_code')
    .eq('id', orderId)
    .maybeSingle();
  const order = currencyRowSchema.safeParse(orderRow);
  if (!order.success) {
    redirect(back(slug, orderId, 'problem=payment'));
  }

  const units = await getCurrencyMinorUnits(order.data.currency_code);
  const minor = toMinorUnits(amountText, units);
  if (minor === null || minor === 0) {
    redirect(back(slug, orderId, 'problem=amountformat'));
  }

  const { error } = await supabase.rpc('confirm_payment', {
    target_payment_id: paymentId,
    received_minor: minor,
  });
  if (error) {
    console.error('confirm_payment failed', error.code);
    const problem = error.code === 'SF009' ? 'amount' : 'payment';
    redirect(back(slug, orderId, `problem=${problem}`));
  }

  revalidatePath(`/dashboard/orders/${slug}`);
  redirect(back(slug, orderId, 'saved=1'));
}

/* Rejects a code that is wrong or did not arrive. This only asks, reject_payment decides. */
export async function rejectPaymentAction(formData: FormData): Promise<void> {
  const parsed = targetSchema.safeParse({
    paymentId: formData.get('paymentId'),
    orderId: formData.get('orderId'),
    slug: formData.get('slug'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { paymentId, orderId, slug } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('reject_payment', { target_payment_id: paymentId });
  if (error) {
    console.error('reject_payment failed', error.code);
    redirect(back(slug, orderId, 'problem=payment'));
  }

  revalidatePath(`/dashboard/orders/${slug}`);
  redirect(back(slug, orderId, 'saved=1'));
}
