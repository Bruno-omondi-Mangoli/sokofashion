'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const listingSchema = z.object({
  shopId: z.string().uuid(),
  slug: z.string().regex(SHOP_LINK_PATTERN),
  listed: z.enum(['true', 'false']),
});

/*
 * Switches a shop on or off the shared page. This only asks. The database
 * function decides, and it refuses everybody except the owner.
 */
export async function setShopListedAction(formData: FormData): Promise<void> {
  const parsed = listingSchema.safeParse({
    shopId: formData.get('shopId'),
    slug: formData.get('slug'),
    listed: formData.get('listed'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('set_shop_listed', {
    target_shop_id: parsed.data.shopId,
    make_listed: parsed.data.listed === 'true',
  });

  if (error) {
    console.error('set_shop_listed failed', error.code);
    redirect(`/dashboard/visibility/${parsed.data.slug}?problem=1`);
  }

  revalidatePath('/browse');
  redirect(`/dashboard/visibility/${parsed.data.slug}?saved=1`);
}
