import { describe, expect, it } from 'vitest';
import { NOT_FOUND_MESSAGE, paymentErrorMessage } from './errors';

describe('paymentErrorMessage', () => {
  it('has a different message for every code submit_payment can raise', () => {
    const messages = ['22023', 'SF008', 'SF011', 'SF012', 'SF013'].map(paymentErrorMessage);
    expect(new Set(messages).size).toBe(5);
  });
  it('has a safe fallback', () => {
    expect(paymentErrorMessage(undefined)).toMatch(/try again/i);
    expect(paymentErrorMessage('XX000')).toBe(paymentErrorMessage(undefined));
  });
  it('never uses technical words', () => {
    for (const code of ['22023', 'SF008', 'SF011', 'SF012', 'SF013', undefined]) {
      expect(paymentErrorMessage(code)).not.toMatch(/sql|database|exception|constraint|null/i);
    }
    expect(NOT_FOUND_MESSAGE).not.toMatch(/sql|database|exception|constraint|null/i);
  });
});
