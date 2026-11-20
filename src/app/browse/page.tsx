import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pindo } from '@/components/ui/pindo';
import { BrowseCard } from '@/features/storefront/browse-card';
import { getPublicBrowse } from '@/features/storefront/browse-queries';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { PAGE_SIZE, pageToOffset } from '@/features/storefront/view';

export const metadata: Metadata = { title: 'Browse all shops' };

type BrowsePageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { page: pageText } = await searchParams;
  const { page, offset } = pageToOffset(pageText);

  const products = await getPublicBrowse(offset);

  const currencies = [...new Set(products.map((product) => product.currency_code))];
  const unitList = await Promise.all(currencies.map((code) => getCurrencyMinorUnits(code)));
  const unitsByCurrency = new Map(currencies.map((code, index) => [code, unitList[index]]));

  const hasMore = products.length === PAGE_SIZE;

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-8">
        <h1 className="font-display text-display text-ink">Browse all shops</h1>
        <p className="text-ink-soft text-base">
          Tap an item to see its sizes and colours. You order from the shop that sells it.
        </p>

        {products.length === 0 ? (
          <EmptyState
            title="Nothing to show yet"
            description="No shop has items on show right now. Please check again soon."
          />
        ) : (
          <div className="grid grid-cols-2 items-start gap-3">
            {products.map((product) => (
              <BrowseCard
                key={product.id}
                product={product}
                minorUnits={unitsByCurrency.get(product.currency_code) ?? 2}
              />
            ))}
          </div>
        )}

        <nav className="flex gap-3" aria-label="More items">
          {page > 1 ? (
            <Link
              href={page === 2 ? '/browse' : `/browse?page=${page - 1}`}
              className={buttonClasses('secondary', 'flex-1')}
            >
              Back
            </Link>
          ) : null}
          {hasMore ? (
            <Link href={`/browse?page=${page + 1}`} className={buttonClasses('primary', 'flex-1')}>
              More items
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
