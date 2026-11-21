import type { PhotoView } from '@/features/photos/photo-tile';

type PhotoStripProps = {
  photos: PhotoView[];
  label: string;
  /* thumb for cards, main for the product page */
  size: 'thumb' | 'main';
};

/*
 * A sideways strip of photos using CSS scroll snap, with no script. Every photo
 * is fitted whole inside a fixed height box and never cropped (D059). Tapping
 * a photo opens the larger version.
 */
export function PhotoStrip({ photos, label, size }: PhotoStripProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="region"
        aria-label={`${label}, photos`}
        tabIndex={0}
        className="bg-sand flex snap-x snap-mandatory overflow-x-auto rounded-lg"
      >
        {photos.map((photo, index) => (
          <a
            key={photo.id}
            href={photo.mainUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${label}, photo ${index + 1}, full size`}
            className="flex h-72 w-full shrink-0 snap-center items-center justify-center"
          >
            {/* A plain img on purpose, as in PhotoTile. The width and height keep the page from jumping. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={size === 'main' ? photo.mainUrl : photo.thumbUrl}
              alt={`${label}, photo ${index + 1} of ${photos.length}`}
              width={photo.width}
              height={photo.height}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-auto max-h-full w-auto max-w-full object-contain"
            />
          </a>
        ))}
      </div>
      {photos.length > 1 ? (
        <p className="text-ink-soft text-sm">
          {photos.length} photos. Swipe sideways to see them all.
        </p>
      ) : null}
    </div>
  );
}
