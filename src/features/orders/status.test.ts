import { describe, expect, it } from 'vitest';
import { ORDER_STATUSES, parseStatusFilter, statusLabels, statusTones } from './status';

describe('order statuses', () => {
  it('has a label and a tone for every status', () => {
    for (const status of ORDER_STATUSES) {
      expect(statusLabels[status].length).toBeGreaterThan(0);
      expect(statusTones[status]).toBeTruthy();
    }
  });
  it('accepts a known status in the address', () => {
    expect(parseStatusFilter('expired')).toBe('expired');
  });
  it('ignores anything else', () => {
    for (const bad of [undefined, '', 'EXPIRED', "x' or '1'='1", 'all']) {
      expect(parseStatusFilter(bad)).toBeNull();
    }
  });
});
