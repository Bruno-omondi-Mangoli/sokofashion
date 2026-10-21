'use client';

import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { registerPhotoAction, removePhotoAction } from './actions';
import { compressPhoto, PhotoError } from './compress';
import { buildPhotoPaths, MAX_PHOTOS_PER_PRODUCT, PHOTO_BUCKET } from './paths';
import { PhotoTile, type PhotoView } from './photo-tile';

type PhotoManagerProps = {
  shopId: string;
  slug: string;
  productId: string;
  productName: string;
  photos: PhotoView[];
};

/* A random id for the new photo. Older connections without a secure page need the fallback. */
function newId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function PhotoManager({ shopId, slug, productId, productName, photos }: PhotoManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const room = MAX_PHOTOS_PER_PRODUCT - photos.length;

  /* Uploads both files of one photo and registers it. If registering fails, the files are cleaned up. */
  async function uploadOne(file: File): Promise<void> {
    const compressed = await compressPhoto(file);
    const supabase = createSupabaseBrowserClient();
    const imageId = newId();
    const paths = buildPhotoPaths(shopId, productId, imageId, compressed.extension);
    const contentType = compressed.extension === 'webp' ? 'image/webp' : 'image/jpeg';
    const options = { contentType, upsert: false, cacheControl: '31536000' };

    const mainUpload = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(paths.main, compressed.main, options);
    if (mainUpload.error) {
      throw new PhotoError('The photo did not upload. Check your connection and try again.');
    }
    const thumbUpload = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(paths.thumb, compressed.thumb, options);
    if (thumbUpload.error) {
      await supabase.storage.from(PHOTO_BUCKET).remove([paths.main]);
      throw new PhotoError('The photo did not upload. Check your connection and try again.');
    }

    const result = await registerPhotoAction({
      slug,
      productId,
      imageId,
      extension: compressed.extension,
      width: compressed.width,
      height: compressed.height,
    });
    if (result.error) {
      await supabase.storage.from(PHOTO_BUCKET).remove([paths.main, paths.thumb]);
      throw new PhotoError(result.error);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    /* Clear the box so the same photo can be chosen again */
    input.value = '';
    if (files.length === 0 || room <= 0) {
      return;
    }

    const chosen = files.slice(0, room);
    setError(null);
    setNotice(
      files.length > room
        ? `Only ${room} more ${room === 1 ? 'photo fits' : 'photos fit'}. The rest were skipped.`
        : null,
    );
    setBusy(true);

    try {
      for (const [index, file] of chosen.entries()) {
        setProgress(`Photo ${index + 1} of ${chosen.length}: making it smaller and uploading`);
        await uploadOne(file);
      }
    } catch (caught) {
      setError(
        caught instanceof PhotoError
          ? caught.message
          : 'Something went wrong with that photo. Please try again.',
      );
    } finally {
      setBusy(false);
      setProgress(null);
      router.refresh();
    }
  }

  async function handleRemove(imageId: string) {
    setBusy(true);
    setError(null);
    const result = await removePhotoAction({ slug, imageId });
    if (result.error) {
      setError(result.error);
    }
    setConfirmingId(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-soft text-sm">
        {photos.length} of {MAX_PHOTOS_PER_PRODUCT} photos. Photos are made smaller on your phone
        before they upload, so they use less data.
      </p>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 items-start gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex flex-col gap-2">
              <PhotoTile photo={photo} label={`Photo ${index + 1} of ${productName}`} />
              {confirmingId === photo.id ? (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => handleRemove(photo.id)}
                  >
                    Yes, remove
                  </Button>
                  <Button variant="secondary" disabled={busy} onClick={() => setConfirmingId(null)}>
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirmingId(photo.id)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {room > 0 ? (
        <label
          className={`bg-primary text-on-primary hover:bg-primary-strong focus-within:outline-primary inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-lg px-5 text-base font-semibold focus-within:outline-3 focus-within:outline-offset-2 sm:w-auto ${busy ? 'pointer-events-none opacity-60' : ''}`}
        >
          {photos.length === 0 ? 'Add a photo' : 'Add another photo'}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      ) : (
        <p className="text-ink-soft text-sm">This product has all 4 photos.</p>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {progress ? <Alert tone="info">{progress}</Alert> : null}
        {notice ? <Alert tone="info">{notice}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </div>
    </div>
  );
}
