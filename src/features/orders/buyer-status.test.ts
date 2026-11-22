import { describe, expect, it } from 'vitest';
import { buyerStatusText } from './buyer-status';
import { ORDER_STATUSES } from './status';

describe('buyerStatusText', () => {
  it('has a sentence for every status', () => {
    for (const status of ORDER_STATUSES) {
      expect(buyerStatusText[status].length).toBeGreaterThan(10);
    }
  });
  it('never uses technical words', () => {
    for (const status of ORDER_STATUSES) {
      expect(buyerStatusText[status]).not.toMatch(/sql|database|exception|constraint|null/i);
    }
  });
});
