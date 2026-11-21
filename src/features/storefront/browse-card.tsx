import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/features/catalogue/money';
import { publicPhotoUrl } from '@/features/photos/urls';
import type { BrowseProduct } from './browse-schemas';

/*
 * Every card has the same width and height. The photo is never cropped (D059):
 * it is fitted whole inside a fixed box on a sand backdrop. The whole card is
 * one tap target through the title link, and the shop link sits above it.
 * Motion is a small lift and only runs when the phone allows motion.
 */
export function BrowseCard({
  product,
  minorUnits,
}: {
  product: BrowseProduct;
  minorUnits: number;
}) {
  const productHref = `/s/${product.shop.slug}/p/${product.id}`;

  return (
    <div className="bg-paper border-hairline focus-within:ring-primary relative flex h-full flex-col gap-3 rounded-xl border p-3 focus-within:ring-2 hover:shadow-md motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.98]">
      <div className="bg-sand relative flex h-48 items-center justify-center rounded-lg sm:h-56">
        {product.cover ? (
          /* A plain img on purpose, as in PhotoTile. The title link below names it, so the picture needs no second description. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={publicPhotoUrl(product.cover.thumb_path)}
            alt=""
            width={product.cover.width}
            height={product.cover.height}
            loading="lazy"
            decoding="async"
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        ) : null}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge tone={product.in_stock ? 'positive' : 'muted'}>
            {product.in_stock ? 'In stock' : 'Sold out'}
          </Badge>
          {product.is_new ? <Badge tone="owner">New</Badge> : null}
        </div>
      </div>

      <h2 className="font-display text-ink line-clamp-2 min-h-14 text-lg">
        <Link
          href={productHref}
          className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
        >
          {product.name}
        </Link>
      </h2>

      <div className="mt-auto flex flex-col gap-1">
        <p className="text-ink text-base font-semibold">
          {formatMoney(product.price_minor, product.currency_code, minorUnits)}
        </p>
        <Link
          href={`/s/${product.shop.slug}`}
          className="text-ink-soft relative z-10 w-fit text-sm underline underline-offset-4"
        >
          {product.shop.name}
        </Link>
      </div>
    </div>
  );
}
