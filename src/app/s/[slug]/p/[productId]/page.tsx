import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pindo } from '@/components/ui/pindo';
import { PhotoTile } from '@/features/photos/photo-tile';
import { publicPhotoUrl } from '@/features/photos/urls';
import { getCurrencyMinorUnits, getPublicProduct } from '@/features/storefront/queries';
import { VariantPicker } from '@/features/storefront/variant-picker';
import { buildPhotoViews } from '@/features/storefront/view';

type ProductPageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const result = await getPublicProduct(slug, productId);
  return { title: result ? `${result.product.name} at ${result.shop.name}` : 'Item not found' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  const result = await getPublicProduct(slug, productId);
  if (!result) {
    notFound();
  }

  const { shop, product } = result;
  const minorUnits = await getCurrencyMinorUnits(product.currency_code);
  const photos = buildPhotoViews(product.images, publicPhotoUrl);
  const cover = photos[0];
  const others = photos.slice(1);

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link
          href={`/s/${shop.slug}`}
          className="text-ink-soft text-base underline underline-offset-4"
        >
          Back to {shop.name}
        </Link>

        <h1 className="font-display text-display text-ink">{product.name}</h1>

        {cover ? (
          <PhotoTile photo={{ ...cover, thumbUrl: cover.mainUrl }} label={product.name} />
        ) : null}
        {others.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {others.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                label={`${product.name}, photo ${index + 2}`}
              />
            ))}
          </div>
        ) : null}

        <Card>
          <VariantPicker
            variants={product.variants}
            currencyCode={product.currency_code}
            minorUnits={minorUnits}
          />
        </Card>

        {product.description ? (
          <p className="text-ink-soft text-base whitespace-pre-line">{product.description}</p>
        ) : null}

        <Link href={`/s/${shop.slug}`} className={buttonClasses('secondary', 'w-full')}>
          See more from {shop.name}
        </Link>
      </main>
    </div>
  );
}
