import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { thumbPathFor } from './paths';

const photoRows = z.array(
  z.object({
    id: z.uuid(),
    storage_path: z.string(),
    width: z.number().int(),
    height: z.number().int(),
    sort_order: z.number().int(),
  }),
);

const coverRows = z.array(
  z.object({ product_id: z.uuid(), storage_path: z.string(), sort_order: z.number().int() }),
);

export type ProductPhoto = {
  id: string;
  path: string;
  thumbPath: string;
  width: number;
  height: number;
  sortOrder: number;
};

/* The photos of one product, in order. Row Level Security limits this to the shop's members. */
export async function getProductPhotos(
  supabase: SupabaseClient,
  productId: string,
): Promise<ProductPhoto[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('id, storage_path, width, height, sort_order')
    .eq('product_id', productId)
    .order('sort_order');

  if (error) {
    throw new Error(`Could not load photos (${error.code})`);
  }

  return photoRows.parse(data ?? []).map((row) => ({
    id: row.id,
    path: row.storage_path,
    thumbPath: thumbPathFor(row.storage_path),
    width: row.width,
    height: row.height,
    sortOrder: row.sort_order,
  }));
}

/* The thumbnail path of the first photo of each product, for lists */
export async function getCoverThumbPaths(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  if (productIds.length === 0) {
    return covers;
  }

  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, storage_path, sort_order')
    .in('product_id', productIds)
    .order('sort_order');

  if (error) {
    throw new Error(`Could not load cover photos (${error.code})`);
  }

  for (const row of coverRows.parse(data ?? [])) {
    if (!covers.has(row.product_id)) {
      covers.set(row.product_id, thumbPathFor(row.storage_path));
    }
  }
  return covers;
}
