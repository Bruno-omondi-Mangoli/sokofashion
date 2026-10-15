'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createShopSchema } from './schemas';
import type { ShopFormState } from './types';

/*
 * Turns a database error code into a message a seller can act on. Taken and
 * reserved link names share one message, so the list of reserved names and the
 * list of existing shops are not revealed.
 */
function messageForErrorCode(code: string | undefined): string {
  switch (code) {
    case '23505':
    case '23514':
      return 'That link name is not available. Try another one.';
    case '22023':
      return 'Shops cannot be created in that country yet.';
    case '54000':
      return 'You have reached the limit of 3 shops.';
    case '28000':
    case '42501':
      return 'Please log in again and retry.';
    default:
      return 'We could not create your shop. Please try again.';
  }
}

export async function createShopAction(
  _previous: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const parsed = createShopSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    countryCode: formData.get('countryCode'),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/login');
  }

  const { error } = await supabase.rpc('create_shop', {
    shop_name: parsed.data.name,
    shop_slug: parsed.data.slug,
    shop_country_code: parsed.data.countryCode,
  });

  if (error) {
    console.error('create_shop failed', { code: error.code });
    return { error: messageForErrorCode(error.code) };
  }

  redirect('/dashboard');
}
