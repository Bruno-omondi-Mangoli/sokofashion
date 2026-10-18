import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Category, ProductListItem, ShopCurrency } from './types';

/*
 * Every result from the database is checked with Zod before the app uses it.
 * If the database ever returns something unexpected, the page fails clearly
 * instead of showing wrong prices or stock.
 */
const categoryRows = z.array(z.object({ code: z.string(), name_en: z.string() }));

const shopRow = z.object({
  currency_code: z.string(),
  country_code: z.string(),
});
const countryRow = z.object({
  currency_minor_units: z.number().int().min(0).max(4),
});

const productRows = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    category_code: z.string(),
    price_minor: z.number().int(),
    currency_code: z.string(),
    status: z.enum(['draft', 'active', 'archived']),
  }),
);

const stockRows = z.array(z.object({ product_id: z.uuid(), on_hand: z.number().int() }));

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('code, name_en')
    .order('sort_order');

  if (error) {
    throw new Error(`Could not load categories (${error.code})`);
  }

  return categoryRows.parse(data ?? []).map((row) => ({ code: row.code, name: row.name_en }));
}

/* The currency of a shop and how many decimal places that currency has */
export async function getShopCurrency(
  supabase: SupabaseClient,
  shopId: string,
): Promise<ShopCurrency> {
  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('currency_code, country_code')
    .eq('id', shopId)
    .single();

  if (shopError) {
    throw new Error(`Could not load the shop currency (${shopError.code})`);
  }
  const shop = shopRow.parse(shopData);

  const { data: countryData, error: countryError } = await supabase
    .from('countries')
    .select('currency_minor_units')
    .eq('code', shop.country_code)
    .single();

  if (countryError) {
    throw new Error(`Could not load the currency details (${countryError.code})`);
  }
  const country = countryRow.parse(countryData);

  return {
    currencyCode: shop.currency_code,
    minorUnits: country.currency_minor_units,
  };
}

/*
 * The newest 100 products of a shop, each with how many variants it has and how
 * many items are in stock in total. Row Level Security limits both queries to
 * the shop's own data.
 */
export async function getProductList(
  supabase: SupabaseClient,
  shopId: string,
): Promise<ProductListItem[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category_code, price_minor, currency_code, status')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Could not load products (${error.code})`);
  }

  const products = productRows.parse(data ?? []);
  if (products.length === 0) {
    return [];
  }

  const { data: stockData, error: stockError } = await supabase
    .from('variant_stock')
    .select('product_id, on_hand')
    .in(
      'product_id',
      products.map((product) => product.id),
    );

  if (stockError) {
    throw new Error(`Could not load stock (${stockError.code})`);
  }

  const totals = new Map<string, { variants: number; onHand: number }>();
  for (const row of stockRows.parse(stockData ?? [])) {
    const current = totals.get(row.product_id) ?? { variants: 0, onHand: 0 };
    totals.set(row.product_id, {
      variants: current.variants + 1,
      onHand: current.onHand + row.on_hand,
    });
  }

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryCode: product.category_code,
    priceMinor: product.price_minor,
    currencyCode: product.currency_code,
    status: product.status,
    variantCount: totals.get(product.id)?.variants ?? 0,
    totalOnHand: totals.get(product.id)?.onHand ?? 0,
  }));
}
