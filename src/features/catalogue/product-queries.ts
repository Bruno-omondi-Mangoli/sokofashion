import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ProductStatus } from './types';

const productRow = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category_code: z.string(),
  price_minor: z.number().int(),
  currency_code: z.string(),
  status: z.enum(['draft', 'active', 'archived']),
});

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  categoryCode: string;
  priceMinor: number;
  currencyCode: string;
  status: ProductStatus;
};

/* One product of a shop, or null if it does not exist or is not visible to this person */
export async function getProductDetail(
  supabase: SupabaseClient,
  shopId: string,
  productId: string,
): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, category_code, price_minor, currency_code, status')
    .eq('shop_id', shopId)
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the product (${error.code})`);
  }
  if (!data) {
    return null;
  }

  const row = productRow.parse(data);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryCode: row.category_code,
    priceMinor: row.price_minor,
    currencyCode: row.currency_code,
    status: row.status,
  };
}
