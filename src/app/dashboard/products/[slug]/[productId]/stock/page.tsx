import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { getProductDetail } from '@/features/catalogue/product-queries';
import { findMemberShop } from '@/features/shops/access';
import { recordStockAction, undoMovementAction } from '@/features/stock/actions';
import { reasonLabels, undoableReasons } from '@/features/stock/movement';
import { getRecentMovements, getVariantStock } from '@/features/stock/queries';
import { StockForm } from '@/features/stock/stock-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Stock' };

type StockPageProps = {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<{ problem?: string; saved?: string }>;
};

/* Dates are shown in Kenyan time for now. Each shop will get its own time zone later. */
function formatWhen(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function StockPage({ params, searchParams }: StockPageProps) {
  const { slug, productId } = await params;
  const { problem, saved } = await searchParams;

  if (!z.uuid().safeParse(productId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const found = await findMemberShop(supabase, slug);
  if (!found) {
    redirect('/dashboard');
  }
  const { shop, user } = found;
  const canManage = shop.role === 'owner' || shop.role === 'manager';

  const product = await getProductDetail(supabase, shop.id, productId);
  if (!product) {
    redirect(`/dashboard/products/${shop.slug}`);
  }

  const variants = await getVariantStock(supabase, product.id);
  const movements = canManage ? await getRecentMovements(supabase, variants) : [];
  const undoneIds = new Set(
    movements.flatMap((movement) => (movement.reversesId ? [movement.reversesId] : [])),
  );
  const total = variants.reduce((sum, variant) => sum + variant.onHand, 0);

  return (
    <AppShell
      title={`Stock for ${product.name}`}
      userEmail={user.email}
      signOut={signOutAction}
      backHref={`/dashboard/products/${shop.slug}/${product.id}`}
      backLabel="Back to the product"
    >
      {saved === 'undone' ? (
        <Alert tone="success">That change was undone. The history keeps both entries.</Alert>
      ) : null}
      {problem === 'undo-stock' ? (
        <Alert tone="error">
          That change cannot be undone, because some of that stock has already gone.
        </Alert>
      ) : null}
      {problem === 'undo' ? (
        <Alert tone="error">That change could not be undone. It may already be undone.</Alert>
      ) : null}

      <section aria-labelledby="levels-heading" className="flex flex-col gap-3">
        <h2 id="levels-heading" className="font-display text-title text-ink">
          In stock now: {total}
        </h2>
        <ul className="flex flex-col gap-3">
          {variants.map((variant) => (
            <li key={variant.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold">{variant.name}</p>
                  <p className="text-ink text-lg font-semibold">{variant.onHand}</p>
                </div>
                {variant.onHand === 0 ? <Badge tone="negative">Out of stock</Badge> : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {canManage ? (
        <>
          <section aria-labelledby="record-heading" className="flex flex-col gap-3">
            <h2 id="record-heading" className="font-display text-title text-ink">
              Record a stock change
            </h2>
            <Card>
              <StockForm
                action={recordStockAction}
                slug={shop.slug}
                productId={product.id}
                variants={variants.map((variant) => ({ id: variant.id, name: variant.name }))}
              />
            </Card>
          </section>

          <section aria-labelledby="history-heading" className="flex flex-col gap-3">
            <h2 id="history-heading" className="font-display text-title text-ink">
              History
            </h2>
            {movements.length === 0 ? (
              <p className="text-ink-soft text-base">No stock changes yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {movements.map((movement) => {
                  const canUndo =
                    undoableReasons.includes(movement.reason) && !undoneIds.has(movement.id);
                  const who =
                    movement.createdBy === null
                      ? 'the system'
                      : movement.createdBy === user.id
                        ? 'you'
                        : 'a team member';
                  return (
                    <li key={movement.id}>
                      <Card>
                        <p className="text-base font-semibold">
                          {movement.quantityChange > 0 ? '+' : ''}
                          {movement.quantityChange} {movement.variantName}
                        </p>
                        <p className="text-ink-soft text-sm">
                          {reasonLabels[movement.reason] ?? movement.reason},{' '}
                          {formatWhen(movement.createdAt)}, by {who}
                        </p>
                        {movement.note ? <p className="text-ink text-sm">{movement.note}</p> : null}
                        {undoneIds.has(movement.id) ? <Badge tone="muted">Undone</Badge> : null}
                        {canUndo ? (
                          <form action={undoMovementAction}>
                            <input type="hidden" name="slug" value={shop.slug} />
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="movementId" value={movement.id} />
                            <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                              Undo
                            </Button>
                          </form>
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
