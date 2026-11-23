import { z } from 'zod';
import { ORDER_REFERENCE_PATTERN, normalizeReference } from '@/features/orders/reference';
import { MPESA_CODE_PATTERN, normalizeMpesaCode } from './code';

export const PAYMENT_STATUSES = ['pending', 'confirmed', 'rejected'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/* What the browser may send: the three things the buyer typed. There is no amount to forge. */
export const submitInputSchema = z.object({
  reference: z
    .string()
    .max(40)
    .transform(normalizeReference)
    .pipe(z.string().regex(ORDER_REFERENCE_PATTERN)),
  phone: z.string().trim().min(7).max(20),
  code: z.string().max(30).transform(normalizeMpesaCode).pipe(z.string().regex(MPESA_CODE_PATTERN)),
});

/* submit_payment answers null for a wrong reference or phone */
export const submittedPaymentSchema = z
  .object({ status: z.literal('pending'), reference: z.string() })
  .nullable();

/* A payment row as the seller screen reads it */
export const paymentRowSchema = z.object({
  id: z.string(),
  mpesa_code: z.string(),
  status: z.enum(PAYMENT_STATUSES),
  amount_minor: z.number().int().nullable(),
  submitted_at: z.string(),
  decided_at: z.string().nullable(),
});

export type PaymentRow = z.infer<typeof paymentRowSchema>;
