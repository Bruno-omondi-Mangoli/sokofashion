import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const folders = ['src/app/s', 'src/app/browse', 'src/features/storefront', 'src/features/photos'];

function sourceFiles(folder: string): string[] {
  const root = path.join(process.cwd(), folder);
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

describe('public page guard', () => {
  const files = folders.flatMap(sourceFiles);

  it('finds the files it is meant to guard', () => {
    expect(files.length).toBeGreaterThanOrEqual(6);
  });

  it('never uses a cropping style on photos (D059)', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /object-cover|object-fill|object-none|aspect-/,
      );
    }
  });

  it('never injects raw HTML', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/dangerouslySetInnerHTML/);
    }
  });
});
