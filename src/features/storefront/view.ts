import type { PhotoView } from '@/features/photos/photo-tile';
import type { PublicImage, PublicVariant } from './schemas';

export const PAGE_SIZE = 48;
export const MAX_PAGE = 2000;

/* Link names the public page accepts. Anything else is answered as not found without asking the database. */
export const SHOP_LINK_PATTERN = /^[a-z0-9-]{1,60}$/;

/* A readable label for one variant, such as "M / Red" or "Rose / 50 ml" */
export function variantLabel(variant: PublicVariant): string {
  const parts = [
    variant.size,
    variant.colour,
    variant.shade,
    variant.volume_ml ? `${variant.volume_ml} ml` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' / ') : 'Standard';
}

export function productInStock(variants: PublicVariant[]): boolean {
  return variants.some((variant) => variant.in_stock);
}

/* Turns database photo records into the whole photo views the tile needs */
export function buildPhotoViews(
  images: PublicImage[],
  toUrl: (path: string) => string,
): PhotoView[] {
  return images.map((image) => ({
    id: image.id,
    thumbUrl: toUrl(image.thumb_path),
    mainUrl: toUrl(image.path),
    width: image.width,
    height: image.height,
  }));
}

/* Turns the page number in the address into a safe offset */
export function pageToOffset(pageText: string | undefined): { page: number; offset: number } {
  const parsed = Number.parseInt(pageText ?? '1', 10);
  const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_PAGE) : 1;
  return { page, offset: (page - 1) * PAGE_SIZE };
}
