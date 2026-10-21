import { describe, expect, it } from 'vitest';
import { buildPhotoPaths, buildPublicUrl, thumbPathFor } from './paths';

const shop = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const product = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const image = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

describe('buildPhotoPaths', () => {
  it('builds the main and thumbnail paths for webp', () => {
    expect(buildPhotoPaths(shop, product, image, 'webp')).toEqual({
      main: `${shop}/${product}/${image}.webp`,
      thumb: `${shop}/${product}/${image}_t.webp`,
    });
  });

  it('builds the paths for jpg', () => {
    const paths = buildPhotoPaths(shop, product, image, 'jpg');
    expect(paths.main.endsWith('.jpg')).toBe(true);
    expect(paths.thumb.endsWith('_t.jpg')).toBe(true);
  });
});

describe('thumbPathFor', () => {
  it('turns a main path into its thumbnail path', () => {
    expect(thumbPathFor(`${shop}/${product}/${image}.webp`)).toBe(
      `${shop}/${product}/${image}_t.webp`,
    );
    expect(thumbPathFor(`${shop}/${product}/${image}.jpg`)).toBe(
      `${shop}/${product}/${image}_t.jpg`,
    );
  });

  it('agrees with buildPhotoPaths', () => {
    const paths = buildPhotoPaths(shop, product, image, 'webp');
    expect(thumbPathFor(paths.main)).toBe(paths.thumb);
  });
});

describe('buildPublicUrl', () => {
  it('joins the Supabase address and the path', () => {
    expect(buildPublicUrl('http://127.0.0.1:54321', 'a/b/c.webp')).toBe(
      'http://127.0.0.1:54321/storage/v1/object/public/product-images/a/b/c.webp',
    );
  });

  it('ignores a trailing slash on the address', () => {
    expect(buildPublicUrl('https://abc.supabase.co/', 'a/b/c.webp')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/product-images/a/b/c.webp',
    );
  });
});
