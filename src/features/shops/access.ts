import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMyShops } from './queries';
import type { MyShop } from './types';

/*
 * Finds the shop with this link name among the shops the signed in person
 * belongs to. The database still decides what the person may do. These helpers
 * only stop screens and actions early.
 */
export async function findMemberShop(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ user: { id: string; email: string }; shop: MyShop } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  const shops = await getMyShops(supabase, data.user.id);
  const shop = shops.find((candidate) => candidate.slug === slug);
  return shop ? { user: { id: data.user.id, email: data.user.email ?? '' }, shop } : null;
}

/* The same, but only when the person is the owner or a manager of that shop */
export async function findManagedShop(supabase: SupabaseClient, slug: string) {
  const found = await findMemberShop(supabase, slug);
  if (!found || (found.shop.role !== 'owner' && found.shop.role !== 'manager')) {
    return null;
  }
  return found;
}
