import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { signOutAction } from '@/features/auth/actions';
import { formatMoney } from '@/features/catalogue/money';
import { getCategories, getProductList, getShopCurrency } from '@/features/catalogue/queries';
import { statusLabels, type ProductStatus } from '@/features/catalogue/types';
import { getMyShops } from '@/features/shops/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Products' };

type ProductsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
};

const statusTones: Record<ProductStatus, BadgeTone> = {
  draft: 'muted',
  active: 'positive',
  archived: 'muted',
};

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { slug } = await params;
  const { created } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }

  /* Any active member can see the catalogue. Only owners and managers can add to it. */
  const shops = await getMyShops(supabase, data.user.id);
  const shop = shops.find((candidate) => candidate.slug === slug);
  if (!shop) {
    redirect('/dashboard');
  }
  const canAdd = shop.role === 'owner' || shop.role === 'manager';

  const [products, currency, categories] = await Promise.all([
    getProductList(supabase, shop.id),
    getShopCurrency(supabase, shop.id),
    getCategories(supabase),
  ]);
  const categoryNames = new Map(categories.map((category) => [category.code, category.name]));

  return (
    <AppShell
      title={`Products for ${shop.name}`}
      userEmail={data.user.email ?? ''}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {created ? <Alert tone="success">Your product is saved as a draft.</Alert> : null}

      {canAdd && products.length > 0 ? (
        <Link
          href={`/dashboard/products/${shop.slug}/new`}
          className={buttonClasses('primary', 'w-full sm:w-auto')}
        >
          Add a product
        </Link>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description={
            canAdd
              ? 'Add your first product with its price, sizes, colours and how many you have.'
              : 'The owner has not added any products yet.'
          }
          action={
            canAdd ? (
              <Link
                href={`/dashboard/products/${shop.slug}/new`}
                className={buttonClasses('primary', 'w-full sm:w-auto')}
              >
                Add your first product
              </Link>
            ) : undefined
          }
          saying={{
            saying: 'Haba na haba hujaza kibaba.',
            meaning: 'Little by little fills the measure.',
          }}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {products.map((product) => (
            <li key={product.id}>
              <Card>
                <h2 className="font-display text-title text-ink">{product.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTones[product.status]}>{statusLabels[product.status]}</Badge>
                  {product.status !== 'archived' && product.totalOnHand === 0 ? (
                    <Badge tone="negative">Out of stock</Badge>
                  ) : null}
                </div>
                <p className="text-ink text-lg font-semibold">
                  {formatMoney(product.priceMinor, product.currencyCode, currency.minorUnits)}
                </p>
                <p className="text-ink-soft text-sm">
                  {categoryNames.get(product.categoryCode) ?? product.categoryCode}
                  {', '}
                  {product.variantCount} {product.variantCount === 1 ? 'variant' : 'variants'}
                  {', '}
                  {product.totalOnHand} in stock
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
