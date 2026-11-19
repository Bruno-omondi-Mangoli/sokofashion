import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pindo } from '@/components/ui/pindo';
import { ProductCard } from '@/features/storefront/product-card';
import { getCurrencyMinorUnits, getPublicShop } from '@/features/storefront/queries';
import { PAGE_SIZE, pageToOffset } from '@/features/storefront/view';

type ShopPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params, searchParams }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const shop = await getPublicShop(slug, pageToOffset(page).offset);
  return { title: shop ? shop.name : 'Shop not found' };
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { slug } = await params;
  const { page: pageText } = await searchParams;
  const { page, offset } = pageToOffset(pageText);

  const shop = await getPublicShop(slug, offset);
  if (!shop) {
    notFound();
  }

  const minorUnits = await getCurrencyMinorUnits(shop.currency_code);
  const hasMore = shop.products.length === PAGE_SIZE;

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <h1 className="font-display text-display text-ink">{shop.name}</h1>

        {shop.products.length === 0 ? (
          <EmptyState
            title="Nothing for sale here yet"
            description="This shop has no items on show right now. Please check again soon."
          />
        ) : (
          shop.products.map((product) => (
            <ProductCard key={product.id} product={product} minorUnits={minorUnits} />
          ))
        )}

        <nav className="flex gap-3" aria-label="More items">
          {page > 1 ? (
            <Link
              href={page === 2 ? `/s/${shop.slug}` : `/s/${shop.slug}?page=${page - 1}`}
              className={buttonClasses('secondary', 'flex-1')}
            >
              Back
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={`/s/${shop.slug}?page=${page + 1}`}
              className={buttonClasses('primary', 'flex-1')}
            >
              More items
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
