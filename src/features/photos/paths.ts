/*
 * File names for product photos. The browser never invents a path. The same
 * pattern is enforced by the database, so a photo stored anywhere else is
 * refused.
 */

export const PHOTO_BUCKET = 'product-images';
export const MAX_PHOTOS_PER_PRODUCT = 4;

export type PhotoExtension = 'webp' | 'jpg';

export function buildPhotoPaths(
  shopId: string,
  productId: string,
  imageId: string,
  extension: PhotoExtension,
): { main: string; thumb: string } {
  const folder = `${shopId}/${productId}`;
  return {
    main: `${folder}/${imageId}.${extension}`,
    thumb: `${folder}/${imageId}_t.${extension}`,
  };
}

/* The thumbnail file that goes with a main photo file */
export function thumbPathFor(mainPath: string): string {
  return mainPath.replace(/\.(webp|jpg)$/, '_t.$1');
}

/* The public web address of a stored photo, from the Supabase address and the file path */
export function buildPublicUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
