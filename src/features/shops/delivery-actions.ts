'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { toMinorUnits } from '@/features/catalogue/money';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const deliverySchema = z.object({
  shopId: z.string().uuid(),
  slug: z.string().regex(SHOP_LINK_PATTERN),
  mode: z.enum(['pickup_only', 'free_delivery', 'paid_delivery']),
  fee: z.string().max(20),
});

const currencyRowSchema = z.object({ currency_code: z.string() });

/*
 * Saves how a shop delivers. This only asks. set_shop_delivery decides, and it
 * refuses everybody except the owner and any fee that does not fit the mode.
 */
export async function setShopDeliveryAction(formData: FormData): Promise<void> {
  const parsed = deliverySchema.safeParse({
    shopId: formData.get('shopId'),
    slug: formData.get('slug'),
    mode: formData.get('mode'),
    fee: String(formData.get('fee') ?? ''),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { shopId, slug, mode, fee } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { data: shopRow } = await supabase
    .from('shops')
    .select('currency_code')
    .eq('id', shopId)
    .maybeSingle();
  const shop = currencyRowSchema.safeParse(shopRow);
  if (!shop.success) {
    redirect(`/dashboard/delivery/${slug}?problem=1`);
  }

  let feeMinor = 0;
  if (mode === 'paid_delivery') {
    const units = await getCurrencyMinorUnits(shop.data.currency_code);
    const converted = toMinorUnits(fee, units);
    if (converted === null || converted === 0) {
      redirect(`/dashboard/delivery/${slug}?problem=fee`);
    }
    feeMinor = converted;
  }

  const { error } = await supabase.rpc('set_shop_delivery', {
    target_shop_id: shopId,
    new_mode: mode,
    new_fee_minor: feeMinor,
  });
  if (error) {
    console.error('set_shop_delivery failed', error.code);
    redirect(`/dashboard/delivery/${slug}?problem=1`);
  }

  revalidatePath(`/checkout/${slug}`);
  redirect(`/dashboard/delivery/${slug}?saved=1`);
}
