import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';

/* Reads the colour tokens straight from the stylesheet, so there is one source of truth */
function readColourTokens(): Record<string, string> {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

const tokens = readColourTokens();

/* Text on a background. WCAG AA needs 4.5 to 1 for normal text. */
const textPairs: Array<[string, string, number]> = [
  ['ink', 'paper', 4.5],
  ['ink', 'sand', 4.5],
  ['ink-soft', 'paper', 4.5],
  ['ink-soft', 'sand', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-primary', 'primary-strong', 4.5],
  ['primary', 'paper', 4.5],
  ['primary', 'sand', 4.5],
  ['ink', 'marigold', 4.5],
  ['ink', 'marigold-strong', 4.5],
  ['hibiscus', 'paper', 4.5],
  ['hibiscus', 'sand', 4.5],
  ['paper', 'hibiscus', 4.5],
  ['teal', 'paper', 4.5],
  ['teal', 'sand', 4.5],
  ['paper', 'teal', 4.5],
  ['danger', 'paper', 4.5],
  ['danger', 'danger-wash', 4.5],
  ['success', 'paper', 4.5],
  ['success', 'success-wash', 4.5],
  ['ink', 'hairline', 4.5],
];

/* Borders that must be visible, such as the edge of a form field. WCAG needs 3 to 1. */
const borderPairs: Array<[string, string, number]> = [
  ['line', 'paper', 3],
  ['line', 'sand', 3],
];

describe('design tokens', () => {
  it('defines every colour that the checks below rely on', () => {
    const used = [...textPairs, ...borderPairs].flatMap(([first, second]) => [first, second]);
    const missing = used.filter((name) => !tokens[name]);
    expect(missing).toEqual([]);
  });

  it.each(textPairs)('text colour %s on %s reaches at least %s to 1', (first, second, minimum) => {
    expect(contrastRatio(tokens[first], tokens[second])).toBeGreaterThanOrEqual(minimum);
  });

  it.each(borderPairs)(
    'border colour %s on %s reaches at least %s to 1',
    (first, second, minimum) => {
      expect(contrastRatio(tokens[first], tokens[second])).toBeGreaterThanOrEqual(minimum);
    },
  );
});
