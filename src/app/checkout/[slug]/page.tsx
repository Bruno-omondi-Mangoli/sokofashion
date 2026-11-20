import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pindo } from '@/components/ui/pindo';
import { CheckoutForm } from '@/features/orders/checkout-form';
import { getCheckoutInfo } from '@/features/orders/queries';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';

export const metadata: Metadata = { title: 'Place your order' };

type CheckoutPageProps = { params: Promise<{ slug: string }> };

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const info = await getCheckoutInfo(slug);
  if (!info) {
    notFound();
  }
  const minorUnits = await getCurrencyMinorUnits(info.currency_code);

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/cart" className="text-ink-soft text-base underline underline-offset-4">
          Back to your cart
        </Link>
        <h1 className="font-display text-display text-ink">Place your order</h1>
        <CheckoutForm info={info} minorUnits={minorUnits} />
      </main>
    </div>
  );
}
