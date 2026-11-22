'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const whatsappSchema = z.object({
  shopId: z.string().uuid(),
  slug: z.string().regex(SHOP_LINK_PATTERN),
  phone: z.string().max(30),
});

/*
 * Saves the number buyers use to message the shop. This only asks.
 * set_shop_whatsapp decides, and it refuses everybody except the owner and any
 * number that is not a Kenyan mobile number. An empty value removes the number.
 */
export async function setShopWhatsappAction(formData: FormData): Promise<void> {
  const parsed = whatsappSchema.safeParse({
    shopId: formData.get('shopId'),
    slug: formData.get('slug'),
    phone: String(formData.get('phone') ?? ''),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { shopId, slug, phone } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('set_shop_whatsapp', {
    target_shop_id: shopId,
    new_phone: phone,
  });
  if (error) {
    console.error('set_shop_whatsapp failed', error.code);
    redirect(`/dashboard/whatsapp/${slug}?problem=${error.code === '22023' ? 'format' : '1'}`);
  }

  revalidatePath(`/checkout/${slug}`);
  redirect(`/dashboard/whatsapp/${slug}?saved=1`);
}
