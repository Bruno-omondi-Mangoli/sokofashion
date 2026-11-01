import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { variantName } from './movement';

const variantRows = z.array(
  z.object({
    id: z.uuid(),
    size: z.string().nullable(),
    colour: z.string().nullable(),
    shade: z.string().nullable(),
    is_active: z.boolean(),
  }),
);

const stockRows = z.array(z.object({ variant_id: z.uuid(), on_hand: z.number().int() }));

const movementRows = z.array(
  z.object({
    id: z.uuid(),
    variant_id: z.uuid(),
    quantity_change: z.number().int(),
    reason: z.string(),
    note: z.string().nullable(),
    reverses_id: z.uuid().nullable(),
    created_by: z.uuid().nullable(),
    created_at: z.string(),
  }),
);

export type VariantStock = {
  id: string;
  name: string;
  onHand: number;
  isActive: boolean;
};

export type StockMovement = {
  id: string;
  variantName: string;
  quantityChange: number;
  reason: string;
  note: string | null;
  reversesId: string | null;
  createdBy: string | null;
  createdAt: string;
};

/* Every variant of a product with how many are in stock. Row Level Security limits this to the shop. */
export async function getVariantStock(
  supabase: SupabaseClient,
  productId: string,
): Promise<VariantStock[]> {
  const { data: variantData, error: variantError } = await supabase
    .from('product_variants')
    .select('id, size, colour, shade, is_active')
    .eq('product_id', productId)
    .order('created_at')
    .order('id');

  if (variantError) {
    throw new Error(`Could not load variants (${variantError.code})`);
  }
  const variants = variantRows.parse(variantData ?? []);
  if (variants.length === 0) {
    return [];
  }

  const { data: stockData, error: stockError } = await supabase
    .from('variant_stock')
    .select('variant_id, on_hand')
    .eq('product_id', productId);

  if (stockError) {
    throw new Error(`Could not load stock (${stockError.code})`);
  }
  const onHand = new Map(
    stockRows.parse(stockData ?? []).map((row) => [row.variant_id, row.on_hand]),
  );

  return variants.map((variant) => ({
    id: variant.id,
    name: variantName(variant),
    onHand: onHand.get(variant.id) ?? 0,
    isActive: variant.is_active,
  }));
}

/* The newest stock changes for a set of variants, newest first */
export async function getRecentMovements(
  supabase: SupabaseClient,
  variants: VariantStock[],
  limit = 30,
): Promise<StockMovement[]> {
  if (variants.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, variant_id, quantity_change, reason, note, reverses_id, created_by, created_at')
    .in(
      'variant_id',
      variants.map((variant) => variant.id),
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load stock history (${error.code})`);
  }

  const names = new Map(variants.map((variant) => [variant.id, variant.name]));
  return movementRows.parse(data ?? []).map((row) => ({
    id: row.id,
    variantName: names.get(row.variant_id) ?? 'Unknown',
    quantityChange: row.quantity_change,
    reason: row.reason,
    note: row.note,
    reversesId: row.reverses_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}
