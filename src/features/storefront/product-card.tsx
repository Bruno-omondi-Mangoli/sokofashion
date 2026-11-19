import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/features/catalogue/money';
import { PhotoTile } from '@/features/photos/photo-tile';
import { publicPhotoUrl } from '@/features/photos/urls';
import type { PublicProduct } from './schemas';
import { buildPhotoViews, productInStock, variantLabel } from './view';

export function ProductCard({
  product,
  minorUnits,
}: {
  product: PublicProduct;
  minorUnits: number;
}) {
  const photos = buildPhotoViews(product.images, publicPhotoUrl);
  const cover = photos[0];
  const others = photos.slice(1);
  const available = productInStock(product.variants);

  return (
    <Card>
      {cover ? <PhotoTile photo={cover} label={product.name} /> : null}
      {others.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {others.map((photo, index) => (
            <PhotoTile key={photo.id} photo={photo} label={`${product.name}, photo ${index + 2}`} />
          ))}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-title text-ink">{product.name}</h2>
        <Badge tone={available ? 'positive' : 'muted'}>{available ? 'In stock' : 'Sold out'}</Badge>
      </div>

      <p className="text-ink text-lg font-semibold">
        {formatMoney(product.price_minor, product.currency_code, minorUnits)}
      </p>

      {product.description ? (
        <p className="text-ink-soft text-base whitespace-pre-line">{product.description}</p>
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
