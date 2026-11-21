'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { aboutTooLong, cleanAbout } from './about';

const aboutSchema = z.object({
  shopId: z.string().uuid(),
  slug: z.string().regex(SHOP_LINK_PATTERN),
  about: z.string().max(5000),
});

/*
 * Saves the About this shop text. This only asks. set_shop_about decides, and it
 * refuses everybody except the owner. An empty text removes the About section.
 */
export async function setShopAboutAction(formData: FormData): Promise<void> {
  const parsed = aboutSchema.safeParse({
    shopId: formData.get('shopId'),
    slug: formData.get('slug'),
    about: String(formData.get('about') ?? ''),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const { shopId, slug } = parsed.data;
  const about = cleanAbout(parsed.data.about);

  if (aboutTooLong(about)) {
    redirect(`/dashboard/about/${slug}?problem=long`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('set_shop_about', {
    target_shop_id: shopId,
    new_about: about,
  });
  if (error) {
    console.error('set_shop_about failed', error.code);
    redirect(`/dashboard/about/${slug}?problem=1`);
  }

  revalidatePath(`/s/${slug}`);
  redirect(`/dashboard/about/${slug}?saved=1`);
}
