import { describe, expect, it } from 'vitest';
import { deliveryOffered, previewFee } from './fee';

describe('deliveryOffered', () => {
  it('is false only for pickup only shops', () => {
    expect(deliveryOffered('pickup_only')).toBe(false);
    expect(deliveryOffered('free_delivery')).toBe(true);
    expect(deliveryOffered('paid_delivery')).toBe(true);
  });
});

describe('previewFee', () => {
  it('charges the fee only for paid delivery', () => {
    expect(previewFee('paid_delivery', 30000, 'delivery')).toBe(30000);
  });
  it('is zero for pickup, whatever the shop setting', () => {
    expect(previewFee('paid_delivery', 30000, 'pickup')).toBe(0);
  });
  it('is zero for free delivery and for a pickup only shop', () => {
    expect(previewFee('free_delivery', 0, 'delivery')).toBe(0);
    expect(previewFee('pickup_only', 0, 'delivery')).toBe(0);
  });
});
