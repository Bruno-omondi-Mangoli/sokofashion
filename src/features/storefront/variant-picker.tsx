'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, linkClasses } from '@/components/ui/button';
import { formatMoney } from '@/features/catalogue/money';
import { useCart } from '@/features/cart/use-cart';
import {
  DIMENSION_LABEL,
  defaultSelection,
  dimensionsUsed,
  findVariant,
  optionsFor,
  type Selection,
} from './picker';
import type { PublicVariant } from './schemas';
import { variantLabel } from './view';

export type CartInfo = {
  shopSlug: string;
  shopName: string;
  productId: string;
  productName: string;
  image: { thumbPath: string; width: number; height: number } | null;
};

type VariantPickerProps = {
  variants: PublicVariant[];
  currencyCode: string;
  minorUnits: number;
  cart: CartInfo;
};

/*
 * Lets the buyer choose a size, colour or shade, shows the price and whether
 * that combination is in stock, and adds it to the browser cart. It only helps
 * the buyer look. Price and stock are checked again by the database when an
 * order is placed.
 */
export function VariantPicker({ variants, currencyCode, minorUnits, cart }: VariantPickerProps) {
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(variants));
  const [message, setMessage] = useState<'added' | 'full' | null>(null);
  const { add } = useCart();
  const dimensions = dimensionsUsed(variants);
  const chosen = findVariant(variants, selection);

  function handleAdd() {
    if (!chosen || !chosen.in_stock) {
      return;
    }
    const status = add({
      shopSlug: cart.shopSlug,
      shopName: cart.shopName,
      productId: cart.productId,
      productName: cart.productName,
      variantId: chosen.id,
      variantLabel: variantLabel(chosen),
      priceMinor: chosen.price_minor,
      currencyCode,
      minorUnits,
      quantity: 1,
      thumbPath: cart.image?.thumbPath ?? null,
      width: cart.image?.width ?? null,
      height: cart.image?.height ?? null,
    });
    setMessage(status);
  }

  return (
    <div className="flex flex-col gap-4">
      {dimensions.map((dimension) => (
        <fieldset key={dimension} className="flex flex-col gap-2">
          <legend className="text-ink text-base font-semibold">{DIMENSION_LABEL[dimension]}</legend>
          <div className="flex flex-wrap gap-2">
            {optionsFor(variants, dimension).map((option) => {
              const selected = selection[dimension] === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setSelection((current) => ({ ...current, [dimension]: option }));
                    setMessage(null);
                  }}
                  className={
                    selected
                      ? 'bg-primary text-on-primary min-h-11 min-w-11 rounded-full px-4 text-base font-semibold'
                      : 'bg-paper text-ink border-hairline min-h-11 min-w-11 rounded-full border px-4 text-base font-semibold'
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div role="status" className="flex items-center justify-between gap-3">
        {chosen ? (
          <>
            <span className="text-ink text-lg font-semibold">
              {formatMoney(chosen.price_minor, currencyCode, minorUnits)}
            </span>
            <Badge tone={chosen.in_stock ? 'positive' : 'muted'}>
              {chosen.in_stock ? 'In stock' : 'Sold out'}
            </Badge>
          </>
        ) : (
          <p className="text-ink-soft text-base">
            This combination is not available. Please pick another.
          </p>
        )}
      </div>

      <Button
        variant="primary"
        className="w-full"
        disabled={!chosen || !chosen.in_stock}
        onClick={handleAdd}
      >
        Add to cart
      </Button>

      {message === 'added' ? (
        <Alert tone="success">
          Added to your cart.{' '}
          <Link href="/cart" className={linkClasses}>
            View cart
          </Link>
        </Alert>
      ) : null}
      {message === 'full' ? (
        <Alert tone="error">
          Your cart for this shop is full. Remove something in your cart first.
        </Alert>
      ) : null}
    </div>
  );
}
