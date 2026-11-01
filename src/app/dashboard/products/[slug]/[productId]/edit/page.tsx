import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppShell } from '@/components/ui/app-shell';
import { signOutAction } from '@/features/auth/actions';
import { EditProductForm } from '@/features/catalogue/edit-product-form';
import { updateProductAction } from '@/features/catalogue/manage-actions';
import { toPriceText } from '@/features/catalogue/price-text';
import { getProductDetail } from '@/features/catalogue/product-queries';
import { getCategories, getShopCurrency } from '@/features/catalogue/queries';
import { findManagedShop } from '@/features/shops/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Edit product' };

type EditProductPageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { slug, productId } = await params;

  if (!z.uuid().safeParse(productId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const found = await findManagedShop(supabase, slug);
  if (!found) {
    /* Not signed in, not in this shop, or an attendant: send them to the product page or the dashboard */
    redirect(`/dashboard/products/${slug}/${productId}`);
  }
  const { shop, user } = found;

  const [product, currency, categories] = await Promise.all([
    getProductDetail(supabase, shop.id, productId),
    getShopCurrency(supabase, shop.id),
    getCategories(supabase),
  ]);
  if (!product) {
    redirect(`/dashboard/products/${shop.slug}`);
  }

  return (
    <AppShell
      title="Edit product"
      userEmail={user.email}
      signOut={signOutAction}
      backHref={`/dashboard/products/${shop.slug}/${product.id}`}
      backLabel="Back to the product"
    >
      <EditProductForm
        action={updateProductAction}
        slug={shop.slug}
        productId={product.id}
        categories={categories}
        currencyCode={currency.currencyCode}
        initial={{
          name: product.name,
          categoryCode: product.categoryCode,
          priceText: toPriceText(product.priceMinor, currency.minorUnits),
          description: product.description ?? '',
        }}
      />
    </AppShell>
  );
}
