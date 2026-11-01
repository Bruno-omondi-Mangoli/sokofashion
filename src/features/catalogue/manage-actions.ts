'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { findManagedShop } from '@/features/shops/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveProductSchema, updateProductSchema } from './manage-schemas';
import { toMinorUnits } from './money';
import { getShopCurrency } from './queries';
import type { ProductFormState } from './types';

function messageForErrorCode(code: string | undefined): string {
  switch (code) {
    case '23514':
      return 'The price is not allowed. Use a price between 0 and 1,000,000.';
    case '42501':
      return 'Only owners and managers can change products.';
    default:
      return 'We could not save the changes. Please try again.';
  }
}

/* Saves changes to the name, category, price and description of a product */
export async function updateProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = updateProductSchema.safeParse({
    slug: formData.get('slug'),
    productId: formData.get('productId'),
    name: formData.get('name'),
    category: formData.get('category'),
    price: formData.get('price'),
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check your details and try again' };
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const found = await findManagedShop(supabase, input.slug);
  if (!found) {
    return { error: 'Only owners and managers can change products.' };
  }

  const currency = await getShopCurrency(supabase, found.shop.id);
  const priceMinor = toMinorUnits(input.price, currency.minorUnits);
  if (priceMinor === null) {
    return {
      error: `Enter a valid price in ${currency.currencyCode}, for example 1500. The most allowed is 1,000,000.`,
    };
  }

  /* Select the row back, because Row Level Security changes nothing silently for people without rights */
  const { data: updated, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      category_code: input.category,
      price_minor: priceMinor,
      description: input.description === '' ? null : input.description,
    })
    .eq('id', input.productId)
    .eq('shop_id', found.shop.id)
    .select('id');

  if (error) {
    console.error('product update failed', { code: error.code });
    return { error: messageForErrorCode(error.code) };
  }
  if (!updated || updated.length === 0) {
    return { error: 'We could not find that product to change.' };
  }

  revalidatePath(`/dashboard/products/${found.shop.slug}`, 'layout');
  redirect(`/dashboard/products/${found.shop.slug}/${input.productId}?saved=edited`);
}

/*
 * Archives a product, or brings it back as a draft. A restored product has to
 * be made live again, which needs at least one photo.
 */
export async function archiveProductAction(formData: FormData): Promise<void> {
  const parsed = archiveProductSchema.safeParse({
    slug: formData.get('slug'),
    productId: formData.get('productId'),
    archive: formData.get('archive'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const input = parsed.data;
  const detailPath = `/dashboard/products/${input.slug}/${input.productId}`;

  const supabase = await createSupabaseServerClient();
  const found = await findManagedShop(supabase, input.slug);
  if (!found) {
    redirect('/dashboard');
  }

  const archiving = input.archive === 'true';
  const { data: updated, error } = await supabase
    .from('products')
    .update({ status: archiving ? 'archived' : 'draft' })
    .eq('id', input.productId)
    .eq('shop_id', found.shop.id)
    .select('id');

  if (error || !updated || updated.length === 0) {
    console.error('archive change failed', { code: error?.code });
    redirect(`${detailPath}?problem=failed`);
  }

  revalidatePath(`/dashboard/products/${found.shop.slug}`, 'layout');
  redirect(`${detailPath}?saved=${archiving ? 'archived' : 'restored'}`);
}
