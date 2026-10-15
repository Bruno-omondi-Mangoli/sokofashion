import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Country, MyShop, ShopRole } from './types';

/* Countries where shops can be created right now. Readable by everyone. */
export async function getActiveCountries(supabase: SupabaseClient): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('code, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Could not load countries (${error.code})`);
  }

  return (data ?? []) as Country[];
}

/*
 * The shops the current user actively belongs to, with the user's role in each.
 * Row Level Security already limits both queries to the user's own shops.
 */
export async function getMyShops(supabase: SupabaseClient, userId: string): Promise<MyShop[]> {
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select('id, slug, name')
    .order('created_at');

  if (shopsError) {
    throw new Error(`Could not load shops (${shopsError.code})`);
  }

  const { data: memberships, error: membersError } = await supabase
    .from('shop_members')
    .select('shop_id, role')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (membersError) {
    throw new Error(`Could not load memberships (${membersError.code})`);
  }

  const roleByShop = new Map<string, ShopRole>(
    (memberships ?? []).map((member): [string, ShopRole] => [
      member.shop_id as string,
      member.role as ShopRole,
    ]),
  );

  return (shops ?? []).flatMap((shop) => {
    const role = roleByShop.get(shop.id as string);
    return role
      ? [
          {
            id: shop.id as string,
            slug: shop.slug as string,
            name: shop.name as string,
            role,
          },
        ]
      : [];
  });
}
