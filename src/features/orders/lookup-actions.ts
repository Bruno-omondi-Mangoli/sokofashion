'use server';

import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { lookedUpOrderSchema, lookupInputSchema } from './lookup-schemas';
import type { LookupResponse } from './lookup-types';
import { getCheckoutInfo } from './queries';

/* One message for every failure, so it never says whether a reference exists */
const NOT_FOUND =
  'We could not find an order with those details. Check the reference and the phone number you used. If you tried many times, please wait an hour.';

/*
 * Looks up one order. This only asks. lookup_order decides, counts wrong guesses
 * and refuses the rest. Only error codes are logged, never references or phones.
 */
export async function lookupOrderAction(input: unknown): Promise<LookupResponse> {
  const parsed = lookupInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: NOT_FOUND };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('lookup_order', {
    lookup_reference: parsed.data.reference,
    lookup_phone: parsed.data.phone,
  });

  if (error) {
    console.error('lookup_order failed', error.code);
    return { ok: false, message: NOT_FOUND };
  }

  const order = lookedUpOrderSchema.safeParse(data);
  if (!order.success) {
    console.error('lookup_order returned an unexpected shape');
    return { ok: false, message: NOT_FOUND };
  }
  if (order.data === null) {
    return { ok: false, message: NOT_FOUND };
  }

  const minorUnits = await getCurrencyMinorUnits(order.data.currency_code);

  /* The shop's WhatsApp number is public. If it cannot be read, the receipt just has no button. */
  let whatsappPhone: string | null = null;
  try {
    whatsappPhone = (await getCheckoutInfo(order.data.shop.slug))?.whatsapp_phone ?? null;
  } catch {
    whatsappPhone = null;
  }

  return { ok: true, order: order.data, minorUnits, whatsappPhone };
}
