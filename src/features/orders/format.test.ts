import { describe, expect, it } from 'vitest';
import { formatPhone, formatWhen, whatsappLink } from './format';

describe('formatPhone', () => {
  it('shows a Kenyan number in the local way', () => {
    expect(formatPhone('254712345678')).toBe('0712 345 678');
  });
  it('leaves anything else as it is', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('whatsappLink', () => {
  it('builds a link for a standard number', () => {
    expect(whatsappLink('254712345678')).toBe('https://wa.me/254712345678');
  });
  it('gives null for anything else', () => {
    expect(whatsappLink('javascript:alert(1)')).toBeNull();
    expect(whatsappLink('0712345678')).toBeNull();
  });
});

describe('formatWhen', () => {
  it('formats a real date in Kenyan time', () => {
    expect(formatWhen('2026-11-20T10:00:00Z')).toMatch(/2026/);
  });
  it('does not break on a bad date', () => {
    expect(formatWhen('not a date')).toBe('Unknown time');
  });
});
