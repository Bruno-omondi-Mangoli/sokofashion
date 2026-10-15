import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Country, MyShop } from './types';

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
 * The shops the current user belongs to. Row Level Security filters this to
 * the user's own shops, so no extra filter is needed here.
 */
export async function getMyShops(supabase: SupabaseClient): Promise<MyShop[]> {
  const { data, error } = await supabase.from('shops').select('id, slug, name').order('created_at');

  if (error) {
    throw new Error(`Could not load shops (${error.code})`);
  }

  return (data ?? []) as MyShop[];
}
