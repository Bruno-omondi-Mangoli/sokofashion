import { describe, expect, it } from 'vitest';
import { paymentRowSchema, submitInputSchema, submittedPaymentSchema } from './schemas';

describe('submitInputSchema', () => {
  it('accepts a good input and cleans the reference and code', () => {
    const parsed = submitInputSchema.parse({
      reference: ' sf-abc234 ',
      phone: '0712 345 678',
      code: ' sga4x9k2pq ',
    });
    expect(parsed.reference).toBe('SF-ABC234');
    expect(parsed.code).toBe('SGA4X9K2PQ');
  });
  it('rejects a bad reference, phone or code', () => {
    const good = { reference: 'SF-ABC234', phone: '0712345678', code: 'SGA4X9K2PQ' };
    expect(submitInputSchema.safeParse({ ...good, reference: 'hello' }).success).toBe(false);
    expect(submitInputSchema.safeParse({ ...good, phone: '123' }).success).toBe(false);
    expect(submitInputSchema.safeParse({ ...good, code: 'SHORT' }).success).toBe(false);
  });
  it('has nowhere to put an amount or a status', () => {
    const parsed = submitInputSchema.parse({
      reference: 'SF-ABC234',
      phone: '0712345678',
      code: 'SGA4X9K2PQ',
      amount: 1,
      status: 'confirmed',
    });
    expect(JSON.stringify(parsed)).not.toMatch(/amount|confirmed/);
  });
});

describe('submittedPaymentSchema', () => {
  it('accepts a waiting payment and null', () => {
    expect(
      submittedPaymentSchema.safeParse({ status: 'pending', reference: 'SF-ABC234' }).success,
    ).toBe(true);
    expect(submittedPaymentSchema.safeParse(null).success).toBe(true);
  });
  it('rejects any other status', () => {
    expect(
      submittedPaymentSchema.safeParse({ status: 'confirmed', reference: 'SF-ABC234' }).success,
    ).toBe(false);
  });
});

describe('paymentRowSchema', () => {
  it('accepts a good row and rejects an unknown status', () => {
    const row = {
      id: 'p1',
      mpesa_code: 'SGA4X9K2PQ',
      status: 'pending',
      amount_minor: null,
      submitted_at: '2026-11-22T10:00:00Z',
      decided_at: null,
    };
    expect(paymentRowSchema.safeParse(row).success).toBe(true);
    expect(paymentRowSchema.safeParse({ ...row, status: 'paid' }).success).toBe(false);
  });
});
