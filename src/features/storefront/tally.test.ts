import { describe, expect, it } from 'vitest';
import { TALLY_MAX, tallyGroups } from './tally';

describe('tallyGroups', () => {
  it('is empty for zero and for nonsense', () => {
    expect(tallyGroups(0)).toEqual([]);
    expect(tallyGroups(-3)).toEqual([]);
    expect(tallyGroups(Number.NaN)).toEqual([]);
  });
  it('groups marks in fives', () => {
    expect(tallyGroups(4)).toEqual([4]);
    expect(tallyGroups(5)).toEqual([5]);
    expect(tallyGroups(7)).toEqual([5, 2]);
    expect(tallyGroups(10)).toEqual([5, 5]);
  });
  it('stops drawing after the cap', () => {
    expect(tallyGroups(500)).toEqual([5, 5, 5]);
    expect(tallyGroups(500).reduce((sum, size) => sum + size, 0)).toBe(TALLY_MAX);
  });
});
