import { fitWithin } from './sizing';
import type { PhotoExtension } from './paths';

/*
 * Makes a photo small enough to upload on a slow connection. It runs in the
 * browser, so the full size photo from the phone camera never leaves the
 * phone. It produces a main photo (longest side up to 1200 pixels) and a small
 * thumbnail (up to 400 pixels). WebP is used where the browser can make it,
 * and JPEG everywhere else. Drawing the photo again also removes hidden data
 * such as the GPS location the camera recorded.
 */

export const MAIN_MAX_SIDE = 1200;
export const THUMB_MAX_SIDE = 400;

/* The storage bucket refuses files above 500 KB, so aim a little below */
const MAIN_MAX_BYTES = 450000;
const MAIN_QUALITIES = [0.82, 0.72, 0.62, 0.5];
const MAIN_SIDES = [MAIN_MAX_SIDE, 1000, 800];
const THUMB_QUALITY = 0.7;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/* An error whose message is safe and helpful to show to the seller */
export class PhotoError extends Error {}

export type CompressedPhoto = {
  main: Blob;
  thumb: Blob;
  extension: PhotoExtension;
  width: number;
  height: number;
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function drawScaled(bitmap: ImageBitmap, maxSide: number) {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new PhotoError('Your browser could not prepare the photo. Try another browser.');
  }

  /* A white background, so see through areas do not turn black in a JPEG */
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('That file is not a photo.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new PhotoError('That photo is too large. Choose one under 25 MB.');
  }

  let bitmap: ImageBitmap;
  try {
    /* from-image turns the photo the right way up, as the camera recorded it */
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoError('We could not read that photo. Try a JPEG or PNG photo.');
  }

  try {
    for (const side of MAIN_SIDES) {
      const main = drawScaled(bitmap, side);

      for (const quality of MAIN_QUALITIES) {
        const webp = await toBlob(main.canvas, 'image/webp', quality);
        const usesWebp = webp !== null && webp.type === 'image/webp';
        const blob = usesWebp ? webp : await toBlob(main.canvas, 'image/jpeg', quality);

        if (blob && blob.size <= MAIN_MAX_BYTES) {
          const thumbCanvas = drawScaled(bitmap, THUMB_MAX_SIDE);
          const thumb = await toBlob(
            thumbCanvas.canvas,
            usesWebp ? 'image/webp' : 'image/jpeg',
            THUMB_QUALITY,
          );
          if (!thumb) {
            throw new PhotoError('Your browser could not prepare the photo. Try another one.');
          }
          return {
            main: blob,
            thumb,
            extension: usesWebp ? 'webp' : 'jpg',
            width: main.width,
            height: main.height,
          };
        }
      }
    }

    throw new PhotoError('That photo is too detailed to make small enough. Try another one.');
  } finally {
    bitmap.close();
  }
}
