'use server';

import { redirect } from 'next/navigation';
import { getMyShops } from '@/features/shops/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toMinorUnits } from './money';
import { getShopCurrency } from './queries';
import { createProductPayloadSchema } from './schemas';
import type { ProductFormState } from './types';
import { buildVariantGrid, MAX_VARIANTS, variantKey } from './variants';

/* Turns a database error code into a message a seller can act on */
function messageForErrorCode(code: string | undefined): string {
  switch (code) {
    case '23505':
      return 'Two of your variants, or a product code, are the same. Check the sizes and colours.';
    case '54000':
      return 'You have reached a limit. A shop can have 1000 products and a product can have 50 variants.';
    case '42501':
      return 'Only owners and managers can add products.';
    case '23514':
      return 'The price is not allowed. Use a price between 0 and 1,000,000.';
    case '22023':
    case '22P02':
      return 'One of the stock numbers is not valid. Use whole numbers only.';
    default:
      return 'We could not save the product. Please try again.';
  }
}

export async function createProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const raw = formData.get('payload');
  if (typeof raw !== 'string') {
    return { error: 'Something went wrong. Reload the page and try again.' };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: 'Something went wrong. Reload the page and try again.' };
  }

  const parsed = createProductPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
    };
  }
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/login');
  }

  /* The shop and the role come from the database, never from the form */
  const shops = await getMyShops(supabase, userData.user.id);
  const shop = shops.find(
    (candidate) =>
      candidate.id === input.shopId &&
      candidate.slug === input.slug &&
      (candidate.role === 'owner' || candidate.role === 'manager'),
  );
  if (!shop) {
    return { error: 'Only owners and managers can add products.' };
  }

  const currency = await getShopCurrency(supabase, shop.id);
  const priceMinor = toMinorUnits(input.price, currency.minorUnits);
  if (priceMinor === null) {
    return {
      error: `Enter a valid price in ${currency.currencyCode}, for example 1500. The most allowed is 1,000,000.`,
    };
  }

  /* Cosmetics use shades instead of sizes and colours */
  const isCosmetics = input.category === 'cosmetics';
  const grid = isCosmetics
    ? buildVariantGrid([], input.colours)
    : buildVariantGrid(input.sizes, input.colours);

  if (grid.length > MAX_VARIANTS) {
    return {
      error: `That makes ${grid.length} combinations. Use at most ${MAX_VARIANTS}, for example 5 sizes and 10 colours.`,
    };
  }

  const variantList = grid.map((options) => {
    const quantity = input.stock[variantKey(options.size, options.colour)] ?? 0;
    return isCosmetics
      ? { shade: options.colour, opening_stock: quantity }
      : { size: options.size, colour: options.colour, opening_stock: quantity };
  });

  /* New products start as drafts. Photos come next, and a product needs one to go live. */
  const { error } = await supabase.rpc('create_product', {
    target_shop_id: shop.id,
    product_name: input.name,
    product_category: input.category,
    product_price_minor: priceMinor,
    product_description: input.description === '' ? null : input.description,
    initial_status: 'draft',
    variant_list: variantList,
  });

  if (error) {
    console.error('create_product failed', { code: error.code });
    return { error: messageForErrorCode(error.code) };
  }

  redirect(`/dashboard/products/${shop.slug}?created=1`);
}
