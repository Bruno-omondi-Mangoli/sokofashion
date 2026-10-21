import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/* Every file under a folder, so the check cannot miss a new screen */
function filesUnder(folder: string): string[] {
  return readdirSync(join(process.cwd(), folder), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe('photo display', () => {
  it('never crops photos, because sellers want to show the whole item', () => {
    const files = [
      ...filesUnder('src/features/photos'),
      ...filesUnder('src/app/dashboard/products'),
    ];
    expect(files.length).toBeGreaterThan(0);

    const cropping = files.filter((file) => readFileSync(file, 'utf8').includes('object-cover'));
    expect(cropping).toEqual([]);
  });
});
