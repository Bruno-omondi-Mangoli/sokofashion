import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { signOutAction } from '@/features/auth/actions';
import { createProductAction } from '@/features/catalogue/actions';
import { ProductForm } from '@/features/catalogue/product-form';
import { getCategories, getShopCurrency } from '@/features/catalogue/queries';
import { getMyShops } from '@/features/shops/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Add a product' };

type NewProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }

  /* Only owners and managers may add products. The database enforces it too. */
  const shops = await getMyShops(supabase, data.user.id);
  const shop = shops.find(
    (candidate) =>
      candidate.slug === slug && (candidate.role === 'owner' || candidate.role === 'manager'),
  );
  if (!shop) {
    redirect('/dashboard');
  }

  const [categories, currency] = await Promise.all([
    getCategories(supabase),
    getShopCurrency(supabase, shop.id),
  ]);

  return (
    <AppShell
      title="Add a product"
      userEmail={data.user.email ?? ''}
      signOut={signOutAction}
      backHref={`/dashboard/products/${shop.slug}`}
      backLabel="Back to products"
    >
      <ProductForm
        action={createProductAction}
        shopId={shop.id}
        slug={shop.slug}
        categories={categories}
        currencyCode={currency.currencyCode}
      />
    </AppShell>
  );
}
