import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicBrowseResultSchema, type BrowseProduct } from './browse-schemas';

/*
 * Reads live products from every listed shop through get_public_browse, the only
 * door the public has (D064). An answer of null means the offset was refused, so
 * the page shows an empty list.
 */
export const getPublicBrowse = cache(async (offset: number): Promise<BrowseProduct[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_public_browse', { page_offset: offset });

  if (error) {
    console.error('get_public_browse failed', error.code);
    throw new Error('The shared page could not be loaded');
  }

  const parsed = publicBrowseResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error('get_public_browse returned an unexpected shape');
    throw new Error('The shared page could not be loaded');
  }
  return parsed.data?.products ?? [];
});
