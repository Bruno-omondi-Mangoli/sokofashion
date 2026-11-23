import { describe, expect, it } from 'vitest';
import { isMpesaCode, normalizeMpesaCode } from './code';

describe('normalizeMpesaCode', () => {
  it('trims and upper cases', () => {
    expect(normalizeMpesaCode(' sga4x9k2pq ')).toBe('SGA4X9K2PQ');
  });
});

describe('isMpesaCode', () => {
  it('accepts ten letters and digits in any case', () => {
    expect(isMpesaCode('SGA4X9K2PQ')).toBe(true);
    expect(isMpesaCode(' sga4x9k2pq ')).toBe(true);
  });
  it('rejects wrong lengths, spaces and symbols', () => {
    for (const bad of [
      '',
      'SHORT',
      'SGA4X9K2PQX',
      'SGA4X9K2P ',
      'SGA4X-K2PQ',
      "SGA4X9K2P'",
      'SGA4 X9K2P',
    ]) {
      expect(isMpesaCode(bad)).toBe(false);
    }
  });
});
