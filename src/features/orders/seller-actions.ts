'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PRODUCT_ID_PATTERN } from '@/features/storefront/picker';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const cancelSchema = z.object({
  orderId: z.string().regex(PRODUCT_ID_PATTERN),
  slug: z.string().regex(SHOP_LINK_PATTERN),
});

/*
 * Cancels an unpaid order. This only asks. cancel_order decides, and it refuses
 * attendants, other shops and orders that are no longer unpaid.
 */
export async function cancelOrderAction(formData: FormData): Promise<void> {
  const parsed = cancelSchema.safeParse({
    orderId: formData.get('orderId'),
    slug: formData.get('slug'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { orderId, slug } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('cancel_order', { target_order_id: orderId });
  if (error) {
    console.error('cancel_order failed', error.code);
    redirect(
      `/dashboard/orders/${slug}/${orderId}?problem=${error.code === '22023' ? 'changed' : '1'}`,
    );
  }

  revalidatePath(`/dashboard/orders/${slug}`);
  revalidatePath('/browse');
  redirect(`/dashboard/orders/${slug}/${orderId}?saved=1`);
}
