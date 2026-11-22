'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClasses, linkClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { groupByShop } from '@/features/cart/cart-logic';
import { useCart } from '@/features/cart/use-cart';
import { formatMoney } from '@/features/catalogue/money';
import { deliveryOffered, previewFee, type DeliveryChoice } from './fee';
import { shopWhatsappLink } from './format';
import { placeOrderAction } from './place-order-actions';
import type { CheckoutInfo, PlacedOrder } from './schemas';

const inputClass =
  'bg-paper text-ink border-hairline min-h-12 w-full rounded-lg border px-4 text-base';

type CheckoutFormProps = { info: CheckoutInfo; minorUnits: number };

export function CheckoutForm({ info, minorUnits }: CheckoutFormProps) {
  const { lines, ready, clearShop } = useCart();
  const [method, setMethod] = useState<DeliveryChoice>('pickup');
  const [problem, setProblem] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [pending, startTransition] = useTransition();

  if (placed) {
    return (
      <Card>
        <h2 className="font-display text-title text-ink">Order placed</h2>
        <p className="text-ink-soft text-base">Your order reference is</p>
        <p className="font-display text-display text-primary tracking-wide">{placed.reference}</p>
        <p className="text-ink text-lg font-semibold">
          Total: {formatMoney(placed.total_minor, placed.currency_code, minorUnits)}
        </p>
        <p className="text-ink-soft text-base">
          Items {formatMoney(placed.subtotal_minor, placed.currency_code, minorUnits)}, delivery{' '}
          {formatMoney(placed.delivery_fee_minor, placed.currency_code, minorUnits)}.
        </p>
        <Alert tone="info">
          Write down or take a picture of this reference. Your items are kept for you until{' '}
          {new Date(placed.expires_at).toLocaleString('en-KE', {
            timeZone: 'Africa/Nairobi',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          . {info.name} will contact you on the phone number you gave. Paying through the app comes
          soon.
        </Alert>
        {info.whatsapp_phone && shopWhatsappLink(info.whatsapp_phone, placed.reference) ? (
          <a
            href={shopWhatsappLink(info.whatsapp_phone, placed.reference) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('primary', 'w-full')}
          >
            Tell the shop on WhatsApp
          </a>
        ) : null}
        <Link
          href={`/order?ref=${placed.reference}`}
          className={buttonClasses('primary', 'w-full')}
        >
          Look up this order later
        </Link>
        <Link href={`/s/${info.slug}`} className={buttonClasses('secondary', 'w-full')}>
          Back to {info.name}
        </Link>
      </Card>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const group = groupByShop(lines.filter((line) => line.shopSlug === info.slug))[0];

  if (!group) {
    return (
      <EmptyState
        title="Nothing to order"
        description="Your cart for this shop is empty. Pick something first."
        action={
          <Link href={`/s/${info.slug}`} className={buttonClasses('primary')}>
            Back to {info.name}
          </Link>
        }
      />
    );
  }

  const offered = deliveryOffered(info.delivery_mode);
  const fee = previewFee(info.delivery_mode, info.delivery_fee_minor, method);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setProblem(null);
    startTransition(async () => {
      const response = await placeOrderAction({
        shopSlug: info.slug,
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        method,
        address: String(data.get('address') ?? ''),
        items: group.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      });
      if (response.ok) {
        setPlaced(response.order);
        clearShop(info.slug);
      } else {
        setProblem(response.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <h2 className="font-display text-title text-ink">Your items from {info.name}</h2>
        <ul className="flex flex-col gap-2">
          {group.lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-3 text-base">
              <span className="text-ink">
                {line.quantity} x {line.productName} ({line.variantLabel})
              </span>
              <span className="text-ink font-semibold">
                {formatMoney(line.priceMinor * line.quantity, line.currencyCode, line.minorUnits)}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/cart" className={linkClasses}>
          Change my cart
        </Link>
      </Card>

      <Card>
        <h2 className="font-display text-title text-ink">Your details</h2>
        <label className="flex flex-col gap-1 text-base font-semibold">
          Your name
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-base font-semibold">
          Phone number
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="0712 345 678"
            autoComplete="tel"
            className={inputClass}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-ink text-base font-semibold">How do you want it?</legend>
          <label className="flex min-h-12 items-center gap-3 text-base">
            <input
              type="radio"
              name="method"
              checked={method === 'pickup'}
              onChange={() => setMethod('pickup')}
            />
            I will collect it (no fee)
          </label>
          {offered ? (
            <label className="flex min-h-12 items-center gap-3 text-base">
              <input
                type="radio"
                name="method"
                checked={method === 'delivery'}
                onChange={() => setMethod('delivery')}
              />
              Deliver to me (
              {info.delivery_mode === 'paid_delivery'
                ? formatMoney(info.delivery_fee_minor, info.currency_code, minorUnits)
                : 'free'}
              )
            </label>
          ) : (
            <p className="text-ink-soft text-sm">
              This shop does not deliver. You collect your order.
            </p>
          )}
        </fieldset>

        {method === 'delivery' ? (
          <label className="flex flex-col gap-1 text-base font-semibold">
            Where should we deliver?
            <textarea
              name="address"
              required
              minLength={3}
              maxLength={300}
              rows={3}
              className="bg-paper text-ink border-hairline w-full rounded-lg border p-4 text-base"
            />
          </label>
        ) : null}
      </Card>

      <Card>
        <p className="text-ink text-base">
          Items: {formatMoney(group.subtotalMinor, group.currencyCode, group.minorUnits)}
        </p>
        <p className="text-ink text-base">
          Delivery: {formatMoney(fee, info.currency_code, minorUnits)}
        </p>
        <p className="text-ink text-lg font-semibold">
          Total: {formatMoney(group.subtotalMinor + fee, info.currency_code, minorUnits)}
        </p>
        <p className="text-ink-soft text-sm">
          The shop confirms the final prices and stock when you place the order.
        </p>
        {problem ? <Alert tone="error">{problem}</Alert> : null}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? 'Placing your order...' : 'Place order'}
        </Button>
      </Card>
    </form>
  );
}
