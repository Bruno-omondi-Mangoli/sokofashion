import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { formatMoney } from '@/features/catalogue/money';
import { getProductDetail } from '@/features/catalogue/product-queries';
import { getShopCurrency } from '@/features/catalogue/queries';
import { statusLabels, type ProductStatus } from '@/features/catalogue/types';
import { setProductStatusAction } from '@/features/photos/actions';
import { MAX_PHOTOS_PER_PRODUCT } from '@/features/photos/paths';
import { PhotoManager } from '@/features/photos/photo-manager';
import { PhotoTile } from '@/features/photos/photo-tile';
import { getProductPhotos } from '@/features/photos/queries';
import { publicPhotoUrl } from '@/features/photos/urls';
import { getMyShops } from '@/features/shops/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Product' };

type ProductPageProps = {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<{ problem?: string; saved?: string }>;
};

const statusTones: Record<ProductStatus, BadgeTone> = {
  draft: 'muted',
  active: 'positive',
  archived: 'muted',
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, productId } = await params;
  const { problem, saved } = await searchParams;

  if (!z.uuid().safeParse(productId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }

  /* Any active member can look. Only owners and managers can change photos and status. */
  const shops = await getMyShops(supabase, data.user.id);
  const shop = shops.find((candidate) => candidate.slug === slug);
  if (!shop) {
    redirect('/dashboard');
  }
  const canManage = shop.role === 'owner' || shop.role === 'manager';

  const [product, currency, photos] = await Promise.all([
    getProductDetail(supabase, shop.id, productId),
    getShopCurrency(supabase, shop.id),
    getProductPhotos(supabase, productId),
  ]);
  if (!product) {
    redirect(`/dashboard/products/${shop.slug}`);
  }

  const photoViews = photos.map((photo) => ({
    id: photo.id,
    thumbUrl: publicPhotoUrl(photo.thumbPath),
    mainUrl: publicPhotoUrl(photo.path),
    width: photo.width,
    height: photo.height,
  }));

  return (
    <AppShell
      title={product.name}
      userEmail={data.user.email ?? ''}
      signOut={signOutAction}
      backHref={`/dashboard/products/${shop.slug}`}
      backLabel="Back to products"
    >
      {problem === 'photo' ? (
        <Alert tone="error">Add at least one photo before making this product live.</Alert>
      ) : null}
      {problem === 'failed' ? (
        <Alert tone="error">That did not work. Please try again.</Alert>
      ) : null}
      {saved === 'created' ? (
        <Alert tone="success">
          Your product is saved as a draft. Add photos next, then make it live.
        </Alert>
      ) : null}
      {saved === 'active' ? <Alert tone="success">This product is now live.</Alert> : null}
      {saved === 'draft' ? <Alert tone="success">This product is hidden from buyers.</Alert> : null}

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTones[product.status]}>{statusLabels[product.status]}</Badge>
        </div>
        <p className="text-ink text-lg font-semibold">
          {formatMoney(product.priceMinor, product.currencyCode, currency.minorUnits)}
        </p>
        {product.description ? (
          <p className="text-ink-soft text-base">{product.description}</p>
        ) : null}
      </Card>

      <section aria-labelledby="photos-heading" className="flex flex-col gap-3">
        <h2 id="photos-heading" className="font-display text-title text-ink">
          Photos
        </h2>
        {canManage ? (
          <PhotoManager
            shopId={shop.id}
            slug={shop.slug}
            productId={product.id}
            productName={product.name}
            photos={photoViews}
          />
        ) : photoViews.length === 0 ? (
          <p className="text-ink-soft text-base">There are no photos yet.</p>
        ) : (
          <ul className="grid grid-cols-2 items-start gap-3">
            {photoViews.map((photo, index) => (
              <li key={photo.id}>
                <PhotoTile photo={photo} label={`Photo ${index + 1} of ${product.name}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && product.status !== 'archived' ? (
        <section aria-labelledby="status-heading" className="flex flex-col gap-3">
          <h2 id="status-heading" className="font-display text-title text-ink">
            Shop visibility
          </h2>
          {product.status === 'draft' && photos.length === 0 ? (
            <p className="text-ink-soft text-base">
              Add at least one photo to make this product live. You can add up to{' '}
              {MAX_PHOTOS_PER_PRODUCT}.
            </p>
          ) : (
            <form action={setProductStatusAction}>
              <input type="hidden" name="slug" value={shop.slug} />
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="hidden"
                name="status"
                value={product.status === 'active' ? 'draft' : 'active'}
              />
              <Button
                type="submit"
                variant={product.status === 'active' ? 'secondary' : 'primary'}
                className="w-full sm:w-auto"
              >
                {product.status === 'active' ? 'Hide from buyers' : 'Make live'}
              </Button>
            </form>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
