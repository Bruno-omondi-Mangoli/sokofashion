import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';
import { STALL_COLOURS, STALL_TONES, THREAD_KEYS } from '@/features/storefront/stall';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const tokens: Record<string, string> = {};
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[match[1]] = match[2];
}

describe('Soko Street awnings', () => {
  it.each(STALL_TONES)('the %s awning text reaches 4.5 to 1', (tone) => {
    const { bg, text } = STALL_COLOURS[tone];
    expect(tokens[bg], `${bg} is defined`).toBeTruthy();
    expect(tokens[text], `${text} is defined`).toBeTruthy();
    expect(contrastRatio(tokens[text], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(STALL_TONES)('the stylesheet really uses those colours for the %s awning', (tone) => {
    const { bg, text } = STALL_COLOURS[tone];
    const rule = new RegExp(
      `\\.awning-${tone}\\s*\\{[^}]*--awning:\\s*var\\(--color-${bg}\\)[^}]*color:\\s*var\\(--color-${text}\\)`,
    );
    expect(css).toMatch(rule);
  });
});

describe('Soko Street price tags and thread dots', () => {
  it('keeps ink text on both tag colours', () => {
    expect(contrastRatio(tokens.ink, tokens.marigold)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.ink, tokens.hairline)).toBeGreaterThanOrEqual(4.5);
    expect(css).toMatch(/\.price-tag\s*\{[^}]*color:\s*var\(--color-ink\)/);
    expect(css).toMatch(/\.price-tag-live\s*\{[^}]*var\(--color-marigold\)/);
    expect(css).toMatch(/\.price-tag-sold\s*\{[^}]*var\(--color-hairline\)/);
  });

  it('defines a colour for every thread key', () => {
    for (const key of THREAD_KEYS) {
      expect(tokens[`thread-${key}`], `thread-${key}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('keeps an ink ring around every dot, so a pale dot is still visible', () => {
    expect(css).toMatch(/\.thread-dot\s*\{[^}]*border:\s*2px solid var\(--color-ink\)/);
  });
});
