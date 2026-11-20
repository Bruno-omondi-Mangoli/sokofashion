import type { Metadata } from 'next';
import Link from 'next/link';
import { Pindo } from '@/components/ui/pindo';
import { CartView } from '@/features/cart/cart-view';

export const metadata: Metadata = { title: 'Your cart' };

export default function CartPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/browse" className="text-ink-soft text-base underline underline-offset-4">
          Keep browsing
        </Link>
        <h1 className="font-display text-display text-ink">Your cart</h1>
        <p className="text-ink-soft text-base">
          Each shop has its own cart, because you order from one shop at a time.
        </p>
        <CartView />
      </main>
    </div>
  );
}
