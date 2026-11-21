import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pindo } from '@/components/ui/pindo';
import { publicPhotoUrl } from '@/features/photos/urls';
import { Awning } from '@/features/storefront/awning';
import { PhotoStrip } from '@/features/storefront/photo-strip';
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

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <Awning slug={shop.slug}>
        <div className="mx-auto w-full max-w-2xl px-5">
          <p className="font-display text-title">{shop.name}</p>
        </div>
      </Awning>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 pb-8">
        <Link
          href={`/s/${shop.slug}`}
          className="text-ink-soft text-base underline underline-offset-4"
        >
          Back to {shop.name}
        </Link>

        <h1 className="font-display text-display text-ink">{product.name}</h1>

        <PhotoStrip photos={photos} label={product.name} size="main" />

        <Card>
          <VariantPicker
            variants={product.variants}
            currencyCode={product.currency_code}
            minorUnits={minorUnits}
            cart={{
              shopSlug: shop.slug,
              shopName: shop.name,
              productId: product.id,
              productName: product.name,
              image: product.images[0]
                ? {
                    thumbPath: product.images[0].thumb_path,
                    width: product.images[0].width,
                    height: product.images[0].height,
                  }
                : null,
            }}
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
