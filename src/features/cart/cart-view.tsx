'use client';

import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClasses, linkClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/features/catalogue/money';
import { publicPhotoUrl } from '@/features/photos/urls';
import { groupByShop } from './cart-logic';
import { MAX_QUANTITY } from './schemas';
import { useCart } from './use-cart';

export function CartView() {
  const { lines, ready, setQuantity, remove, clearShop } = useCart();

  if (!ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Find something you like and press Add to cart on its page."
        action={
          <Link href="/browse" className={buttonClasses('primary')}>
            Browse all shops
          </Link>
        }
      />
    );
  }

  const groups = groupByShop(lines);

  return (
    <div className="flex flex-col gap-5">
      <Alert tone="info">
        Prices and stock are checked again when you place an order, so they may differ from what you
        see here.
      </Alert>

      {groups.map((group) => (
        <Card key={group.shopSlug}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-title text-ink">{group.shopName}</h2>
            <Link href={`/s/${group.shopSlug}`} className={linkClasses}>
              Visit shop
            </Link>
          </div>

          <ul className="flex flex-col gap-4">
            {group.lines.map((line) => (
              <li
                key={line.variantId}
                className="border-hairline flex gap-3 border-b pb-4 last:border-b-0 last:pb-0"
              >
                {line.thumbPath && line.width && line.height ? (
                  <div className="w-20 shrink-0">
                    {/* A plain img on purpose, as in PhotoTile. The whole photo is shown, never cropped. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicPhotoUrl(line.thumbPath)}
                      alt=""
                      width={line.width}
                      height={line.height}
                      loading="lazy"
                      decoding="async"
                      className="bg-hairline h-auto w-full rounded-lg"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col gap-2">
                  <Link href={`/s/${line.shopSlug}/p/${line.productId}`} className={linkClasses}>
                    {line.productName}
                  </Link>
                  <p className="text-ink-soft text-sm">{line.variantLabel}</p>
                  <p className="text-ink text-base font-semibold">
                    {formatMoney(line.priceMinor, line.currencyCode, line.minorUnits)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      className="min-w-12 px-0"
                      aria-label={`One less ${line.productName}`}
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                    >
                      -
                    </Button>
                    <span
                      className="text-ink min-w-8 text-center text-base font-semibold"
                      aria-live="polite"
                    >
                      {line.quantity}
                    </span>
                    <Button
                      variant="secondary"
                      className="min-w-12 px-0"
                      aria-label={`One more ${line.productName}`}
                      disabled={line.quantity >= MAX_QUANTITY}
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button variant="secondary" onClick={() => remove(line.variantId)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-ink text-lg font-semibold">
            Total: {formatMoney(group.subtotalMinor, group.currencyCode, group.minorUnits)}
          </p>
          <Link href={`/checkout/${group.shopSlug}`} className={buttonClasses('primary', 'w-full')}>
            Place order
          </Link>
          <Button variant="secondary" className="w-full" onClick={() => clearShop(group.shopSlug)}>
            Empty this cart
          </Button>
        </Card>
      ))}
    </div>
  );
}
