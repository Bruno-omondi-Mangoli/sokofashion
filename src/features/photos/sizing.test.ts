import { describe, expect, it } from 'vitest';
import { fitWithin } from './sizing';

describe('fitWithin', () => {
  it('shrinks a wide photo so its width is the limit', () => {
    expect(fitWithin(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
  });

  it('shrinks a tall photo so its height is the limit', () => {
    expect(fitWithin(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 });
  });

  it('never enlarges a small photo', () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });

  it('keeps a photo that is exactly the limit', () => {
    expect(fitWithin(1200, 800, 1200)).toEqual({ width: 1200, height: 800 });
  });

  it('rounds to whole pixels', () => {
    expect(fitWithin(1000, 333, 400)).toEqual({ width: 400, height: 133 });
  });

  it('never makes a side smaller than one pixel', () => {
    expect(fitWithin(10000, 2, 400)).toEqual({ width: 400, height: 1 });
  });
});
