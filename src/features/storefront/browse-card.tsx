import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/features/catalogue/money';
import { publicPhotoUrl } from '@/features/photos/urls';
import type { BrowseProduct } from './browse-schemas';

export function BrowseCard({
  product,
  minorUnits,
}: {
  product: BrowseProduct;
  minorUnits: number;
}) {
  const productHref = `/s/${product.shop.slug}/p/${product.id}`;

  return (
    <div className="bg-paper border-hairline flex flex-col gap-2 rounded-xl border p-3">
      {product.cover ? (
        <Link href={productHref} aria-label={`View ${product.name}`} className="block">
          {/* A plain img on purpose, as in PhotoTile. The width and height keep the page from jumping. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicPhotoUrl(product.cover.thumb_path)}
            alt={product.name}
            width={product.cover.width}
            height={product.cover.height}
            loading="lazy"
            decoding="async"
            className="bg-hairline h-auto w-full rounded-lg"
          />
        </Link>
      ) : null}

      <h2 className="font-display text-ink text-lg">
        <Link href={productHref} className="underline-offset-4 hover:underline">
          {product.name}
        </Link>
      </h2>

      <p className="text-ink text-base font-semibold">
        {formatMoney(product.price_minor, product.currency_code, minorUnits)}
      </p>

      <Link
        href={`/s/${product.shop.slug}`}
        className="text-ink-soft text-sm underline underline-offset-4"
      >
        {product.shop.name}
      </Link>

      <div>
        <Badge tone={product.in_stock ? 'positive' : 'muted'}>
          {product.in_stock ? 'In stock' : 'Sold out'}
        </Badge>
      </div>
    </div>
  );
}
