import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/features/catalogue/money';
import { publicPhotoUrl } from '@/features/photos/urls';
import { PhotoStrip } from './photo-strip';
import { PriceTag } from './price-tag';
import type { PublicProduct } from './schemas';
import { ThreadDots } from './thread-dots';
import { buildPhotoViews, productInStock, variantLabel } from './view';

export function ProductCard({
  product,
  minorUnits,
  shopSlug,
}: {
  product: PublicProduct;
  minorUnits: number;
  shopSlug: string;
}) {
  const photos = buildPhotoViews(product.images, publicPhotoUrl);
  const available = productInStock(product.variants);

  return (
    <Card>
      <PhotoStrip photos={photos} label={product.name} size="thumb" />

      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-title text-ink">
          <Link
            href={`/s/${shopSlug}/p/${product.id}`}
            className="underline-offset-4 hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <Badge tone={available ? 'positive' : 'muted'}>{available ? 'In stock' : 'Sold out'}</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PriceTag soldOut={!available}>
          {formatMoney(product.price_minor, product.currency_code, minorUnits)}
        </PriceTag>
        <ThreadDots variants={product.variants} />
      </div>

      {product.description ? (
        <p className="text-ink-soft line-clamp-3 text-base whitespace-pre-line">
          {product.description}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {product.variants.map((variant) => (
          <li key={variant.id} className="flex items-center justify-between gap-3 text-base">
            <span className="text-ink">
              {variantLabel(variant)}
              {variant.price_minor !== product.price_minor
                ? `, ${formatMoney(variant.price_minor, product.currency_code, minorUnits)}`
                : ''}
            </span>
            <Badge tone={variant.in_stock ? 'positive' : 'muted'}>
              {variant.in_stock ? 'In stock' : 'Sold out'}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
