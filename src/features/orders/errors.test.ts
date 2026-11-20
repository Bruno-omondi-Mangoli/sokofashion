import { describe, expect, it } from 'vitest';
import { orderErrorMessage } from './errors';

describe('orderErrorMessage', () => {
  it('has a clear message for every code place_order can raise', () => {
    const messages = ['SF001', 'SF002', 'SF003', 'SF004', 'SF005', 'SF006', '22023'].map(
      orderErrorMessage,
    );
    expect(new Set(messages).size).toBe(7);
  });
  it('has a safe fallback for anything else', () => {
    expect(orderErrorMessage(undefined)).toMatch(/try again/i);
    expect(orderErrorMessage('XX000')).toBe(orderErrorMessage(undefined));
  });
  it('never mentions technical words', () => {
    for (const code of ['SF001', 'SF003', '22023', undefined]) {
      expect(orderErrorMessage(code)).not.toMatch(/sql|database|exception|constraint/i);
    }
  });
});
