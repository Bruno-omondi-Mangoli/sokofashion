'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { findManagedShop } from '@/features/shops/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toMovement } from './movement';
import { recordStockSchema, undoMovementSchema } from './schemas';
import type { StockFormState } from './types';

function messageForErrorCode(code: string | undefined, message: string): string {
  if (code === '23514' && message.includes('Not enough stock')) {
    return 'You cannot remove more than you have in stock. Check the number and try again.';
  }
  switch (code) {
    case '42501':
      return 'Only owners and managers can change stock.';
    case '22023':
      return 'That change is not allowed.';
    default:
      return 'We could not save the stock change. Please try again.';
  }
}

/* Records one stock change. The database keeps the history and refuses anything that would go below zero. */
export async function recordStockAction(
  _previous: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  const parsed = recordStockSchema.safeParse({
    slug: formData.get('slug'),
    productId: formData.get('productId'),
    variantId: formData.get('variantId'),
    kind: formData.get('kind'),
    quantity: formData.get('quantity'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
      notice: null,
    };
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const found = await findManagedShop(supabase, input.slug);
  if (!found) {
    return { error: 'Only owners and managers can change stock.', notice: null };
  }

  const { changeAmount, reason } = toMovement(input.kind, input.quantity);
  const { error } = await supabase.rpc('record_stock_movement', {
    target_variant_id: input.variantId,
    change_amount: changeAmount,
    movement_reason: reason,
    movement_note: input.note === '' ? null : input.note,
  });

  if (error) {
    console.error('record_stock_movement failed', { code: error.code });
    return { error: messageForErrorCode(error.code, error.message), notice: null };
  }

  revalidatePath(`/dashboard/products/${found.shop.slug}`, 'layout');
  return { error: null, notice: 'Saved. The stock numbers are updated.' };
}

/* Cancels an earlier change by adding the opposite one. The original stays in the history. */
export async function undoMovementAction(formData: FormData): Promise<void> {
  const parsed = undoMovementSchema.safeParse({
    slug: formData.get('slug'),
    productId: formData.get('productId'),
    movementId: formData.get('movementId'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const input = parsed.data;
  const stockPath = `/dashboard/products/${input.slug}/${input.productId}/stock`;

  const supabase = await createSupabaseServerClient();
  const found = await findManagedShop(supabase, input.slug);
  if (!found) {
    redirect('/dashboard');
  }

  const { error } = await supabase.rpc('reverse_stock_movement', {
    target_movement_id: input.movementId,
    reversal_note: 'Undone from the stock screen',
  });

  if (error) {
    console.error('reverse_stock_movement failed', { code: error.code });
    redirect(`${stockPath}?problem=${error.code === '23514' ? 'undo-stock' : 'undo'}`);
  }

  revalidatePath(`/dashboard/products/${found.shop.slug}`, 'layout');
  redirect(`${stockPath}?saved=undone`);
}
