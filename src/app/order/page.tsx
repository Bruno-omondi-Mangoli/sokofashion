import type { Metadata } from 'next';
import Link from 'next/link';
import { Pindo } from '@/components/ui/pindo';
import { OrderLookupForm } from '@/features/orders/order-lookup-form';
import { isOrderReference, normalizeReference } from '@/features/orders/reference';

export const metadata: Metadata = { title: 'Find your order' };

type OrderLookupPageProps = { searchParams: Promise<{ ref?: string }> };

export default async function OrderLookupPage({ searchParams }: OrderLookupPageProps) {
  const { ref } = await searchParams;
  /* Only the reference may come from the address. The phone number is never put in a link. */
  const defaultReference = ref && isOrderReference(ref) ? normalizeReference(ref) : '';

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/browse" className="text-ink-soft text-base underline underline-offset-4">
          Browse all shops
        </Link>
        <h1 className="font-display text-display text-ink">Find your order</h1>
        <p className="text-ink-soft text-base">
          Enter the reference you were given when you placed the order, and the phone number you
          used.
        </p>
        <OrderLookupForm defaultReference={defaultReference} />
      </main>
    </div>
  );
}
