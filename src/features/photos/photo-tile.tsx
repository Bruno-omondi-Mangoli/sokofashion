export type PhotoView = {
  id: string;
  thumbUrl: string;
  mainUrl: string;
  width: number;
  height: number;
};

type PhotoTileProps = {
  photo: PhotoView;
  label: string;
};

/*
 * Shows a whole photo, never cropped. The width and height tell the browser the
 * shape before the photo loads, so the page does not jump. Tapping opens the
 * larger photo in a new tab.
 */
export function PhotoTile({ photo, label }: PhotoTileProps) {
  return (
    <a
      href={photo.mainUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} full size`}
      className="block"
    >
      {/* A plain img is used on purpose. The photo is already small, and Next.js image
          optimisation would add cost and settings we do not need. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.thumbUrl}
        alt={label}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className="bg-hairline h-auto w-full rounded-lg"
      />
    </a>
  );
}
