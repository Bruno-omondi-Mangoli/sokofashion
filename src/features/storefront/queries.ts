import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { currencyUnitsSchema, publicShopResultSchema, type PublicShop } from './schemas';
import { SHOP_LINK_PATTERN } from './view';

/*
 * Reads one shop and its live products through get_public_shop, the only door
 * the public has (D064). Cached per request so the page and its title share one call.
 */
export const getPublicShop = cache(
  async (slug: string, offset: number): Promise<PublicShop | null> => {
    if (!SHOP_LINK_PATTERN.test(slug)) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_public_shop', {
      shop_slug: slug,
      page_offset: offset,
    });

    if (error) {
      console.error('get_public_shop failed', error.code);
      throw new Error('The shop could not be loaded');
    }

    const parsed = publicShopResultSchema.safeParse(data);
    if (!parsed.success) {
      console.error('get_public_shop returned an unexpected shape');
      throw new Error('The shop could not be loaded');
    }
    return parsed.data;
  },
);

/* Decimal places of a currency, from the public countries list. Falls back to 2. */
export const getCurrencyMinorUnits = cache(async (currencyCode: string): Promise<number> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('countries')
    .select('currency_minor_units')
    .eq('currency_code', currencyCode)
    .limit(1)
    .maybeSingle();

  const parsed = currencyUnitsSchema.safeParse(data);
  return parsed.success ? parsed.data.currency_minor_units : 2;
});
