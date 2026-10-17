import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tailwind wiring', () => {
  it('keeps the Tailwind loader in next.config.ts', () => {
    const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
    expect(config).toContain('@tailwindcss/turbopack');
  });
});
