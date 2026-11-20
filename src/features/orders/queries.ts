import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { checkoutInfoSchema, type CheckoutInfo } from './schemas';

/* Reads what a buyer needs to see before ordering, through the only public door for it (D064) */
export const getCheckoutInfo = cache(async (slug: string): Promise<CheckoutInfo | null> => {
  if (!SHOP_LINK_PATTERN.test(slug)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_public_checkout_info', { shop_slug: slug });

  if (error) {
    console.error('get_public_checkout_info failed', error.code);
    throw new Error('The checkout could not be loaded');
  }

  const parsed = checkoutInfoSchema.safeParse(data);
  if (!parsed.success) {
    console.error('get_public_checkout_info returned an unexpected shape');
    throw new Error('The checkout could not be loaded');
  }
  return parsed.data;
});
