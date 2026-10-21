'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getMyShops } from '@/features/shops/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PHOTO_BUCKET, thumbPathFor } from './paths';
import { productStatusSchema, registerPhotoSchema, removePhotoSchema } from './schemas';

export type PhotoActionResult = { error: string | null };

/* The shop with this link name, if the signed in person is its owner or a manager */
async function findManagedShop(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  const shops = await getMyShops(supabase, data.user.id);
  return (
    shops.find(
      (shop) => shop.slug === slug && (shop.role === 'owner' || shop.role === 'manager'),
    ) ?? null
  );
}

type DatabaseError = { code?: string; message: string };

function messageForPhotoError(error: DatabaseError): string {
  if (error.message.includes('at most 4')) {
    return 'A product can have at most 4 photos. Remove one to add another.';
  }
  if (error.message.includes('storage limit')) {
    return 'Your shop has used all its photo space. Remove some photos first.';
  }
  switch (error.code) {
    case '42501':
      return 'Only owners and managers can change photos.';
    case '22023':
      return error.message.includes('live product')
        ? 'A live product needs at least one photo. Hide the product first.'
        : 'The photo did not upload fully. Please try again.';
    default:
      return 'We could not save the photo. Please try again.';
  }
}

/*
 * Called by the browser after both photo files were uploaded. The database
 * works out the file names itself and checks that the files really exist.
 */
export async function registerPhotoAction(input: unknown): Promise<PhotoActionResult> {
  const parsed = registerPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Something went wrong. Reload the page and try again.' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();
  const shop = await findManagedShop(supabase, data.slug);
  if (!shop) {
    return { error: 'Only owners and managers can change photos.' };
  }

  const { error } = await supabase.rpc('add_product_image', {
    target_product_id: data.productId,
    new_image_id: data.imageId,
    image_ext: data.extension,
    image_width: data.width,
    image_height: data.height,
  });

  if (error) {
    console.error('add_product_image failed', { code: error.code });
    return { error: messageForPhotoError(error) };
  }

  revalidatePath(`/dashboard/products/${shop.slug}`, 'layout');
  return { error: null };
}

/* Removes the photo record first, and then deletes both files from storage */
export async function removePhotoAction(input: unknown): Promise<PhotoActionResult> {
  const parsed = removePhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Something went wrong. Reload the page and try again.' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();
  const shop = await findManagedShop(supabase, data.slug);
  if (!shop) {
    return { error: 'Only owners and managers can change photos.' };
  }

  const { data: removedPath, error } = await supabase.rpc('remove_product_image', {
    target_image_id: data.imageId,
  });

  if (error) {
    console.error('remove_product_image failed', { code: error.code });
    return { error: messageForPhotoError(error) };
  }

  if (typeof removedPath === 'string') {
    const { error: storageError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([removedPath, thumbPathFor(removedPath)]);
    if (storageError) {
      /* The record is already gone, so the seller is not blocked. A cleanup job can remove stray files later. */
      console.error('photo files were not deleted', { message: storageError.message });
    }
  }

  revalidatePath(`/dashboard/products/${shop.slug}`, 'layout');
  return { error: null };
}

/* Makes a product live, or hides it again. The database refuses to make a product live without a photo. */
export async function setProductStatusAction(formData: FormData): Promise<void> {
  const parsed = productStatusSchema.safeParse({
    slug: formData.get('slug'),
    productId: formData.get('productId'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    redirect('/dashboard');
  }
  const data = parsed.data;
  const detailPath = `/dashboard/products/${data.slug}/${data.productId}`;

  const supabase = await createSupabaseServerClient();
  const shop = await findManagedShop(supabase, data.slug);
  if (!shop) {
    redirect('/dashboard');
  }

  /* Select the row back, because Row Level Security changes nothing silently for people without rights */
  const { data: updated, error } = await supabase
    .from('products')
    .update({ status: data.status })
    .eq('id', data.productId)
    .eq('shop_id', shop.id)
    .select('id');

  if (error) {
    console.error('product status change failed', { code: error.code });
    redirect(`${detailPath}?problem=${error.code === '23514' ? 'photo' : 'failed'}`);
  }
  if (!updated || updated.length === 0) {
    redirect(`${detailPath}?problem=failed`);
  }

  revalidatePath(`/dashboard/products/${shop.slug}`, 'layout');
  redirect(`${detailPath}?saved=${data.status}`);
}
