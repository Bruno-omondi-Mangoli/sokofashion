import { describe, expect, it } from 'vitest';
import {
  kindNeedsNote,
  movementKindValues,
  movementKinds,
  toMovement,
  undoableReasons,
  variantName,
} from './movement';

describe('toMovement', () => {
  it('adds stock for new stock and returns', () => {
    expect(toMovement('restock', 5)).toEqual({ changeAmount: 5, reason: 'restock' });
    expect(toMovement('return', 1)).toEqual({ changeAmount: 1, reason: 'sale_return' });
  });

  it('removes stock for damage', () => {
    expect(toMovement('damage', 2)).toEqual({ changeAmount: -2, reason: 'damage' });
  });

  it('adds or removes stock for count corrections', () => {
    expect(toMovement('found', 3)).toEqual({ changeAmount: 3, reason: 'adjustment' });
    expect(toMovement('lost', 3)).toEqual({ changeAmount: -3, reason: 'adjustment' });
  });
});

describe('movement kinds', () => {
  it('lists every kind once', () => {
    expect(movementKinds.map((entry) => entry.value).sort()).toEqual(
      [...movementKindValues].sort(),
    );
  });

  it('asks for a note on count corrections only', () => {
    expect(kindNeedsNote('found')).toBe(true);
    expect(kindNeedsNote('lost')).toBe(true);
    expect(kindNeedsNote('restock')).toBe(false);
    expect(kindNeedsNote('damage')).toBe(false);
  });

  it('never allows sales or reversals to be undone by hand', () => {
    expect(undoableReasons).not.toContain('sale');
    expect(undoableReasons).not.toContain('reversal');
  });
});

describe('variantName', () => {
  it('joins size and colour', () => {
    expect(variantName({ size: 'M', colour: 'Red', shade: null })).toBe('M, Red');
  });

  it('uses the shade for cosmetics', () => {
    expect(variantName({ size: null, colour: null, shade: 'Plum' })).toBe('Plum');
  });

  it('names a plain variant', () => {
    expect(variantName({ size: null, colour: null, shade: null })).toBe('One size');
  });
});
