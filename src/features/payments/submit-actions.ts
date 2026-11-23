'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NOT_FOUND_MESSAGE, paymentErrorMessage } from './errors';
import { submitInputSchema, submittedPaymentSchema } from './schemas';
import type { SubmitPaymentResponse } from './types';

/*
 * Sends an M-Pesa code for an order. This only asks. submit_payment decides, counts
 * wrong guesses and refuses the rest. Only error codes are logged, never references,
 * phones or M-Pesa codes.
 */
export async function submitPaymentAction(input: unknown): Promise<SubmitPaymentResponse> {
  const parsed = submitInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: paymentErrorMessage('22023') };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('submit_payment', {
    lookup_reference: parsed.data.reference,
    lookup_phone: parsed.data.phone,
    submitted_code: parsed.data.code,
  });

  if (error) {
    console.error('submit_payment failed', error.code);
    return { ok: false, message: paymentErrorMessage(error.code) };
  }

  const result = submittedPaymentSchema.safeParse(data);
  if (!result.success) {
    console.error('submit_payment returned an unexpected shape');
    return { ok: false, message: paymentErrorMessage(undefined) };
  }
  if (result.data === null) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }
  return { ok: true };
}
