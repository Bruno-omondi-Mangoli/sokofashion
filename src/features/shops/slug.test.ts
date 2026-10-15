import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Mama Njeri Fashion')).toBe('mama-njeri-fashion');
  });

  it('removes accents', () => {
    expect(slugify('Café Zuri')).toBe('cafe-zuri');
  });

  it('turns punctuation into single hyphens', () => {
    expect(slugify("Wanjiku's Shoes & Bags!")).toBe('wanjiku-s-shoes-bags');
  });

  it('collapses repeated separators and trims the ends', () => {
    expect(slugify('  A   B  ')).toBe('a-b');
  });

  it('cuts to 40 characters without a trailing hyphen', () => {
    expect(slugify(`${'a'.repeat(39)} bbbb`)).toBe('a'.repeat(39));
  });

  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('');
  });
});
