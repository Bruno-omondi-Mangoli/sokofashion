import { describe, expect, it } from 'vitest';
import { ABOUT_MAX, aboutTooLong, cleanAbout } from './about';

describe('cleanAbout', () => {
  it('makes line breaks one character and trims the ends', () => {
    expect(cleanAbout('  Hello\r\nworld  ')).toBe('Hello\nworld');
  });
  it('turns only spaces into an empty text', () => {
    expect(cleanAbout('   ')).toBe('');
  });
});

describe('aboutTooLong', () => {
  it('allows exactly the limit and refuses one more', () => {
    expect(aboutTooLong('x'.repeat(ABOUT_MAX))).toBe(false);
    expect(aboutTooLong('x'.repeat(ABOUT_MAX + 1))).toBe(true);
  });
  it('counts a two character line break as one', () => {
    expect(aboutTooLong(`${'x'.repeat(ABOUT_MAX - 1)}\r\n`.trimEnd())).toBe(false);
  });
});
