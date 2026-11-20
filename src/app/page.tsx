import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import { Pindo } from '@/components/ui/pindo';
import { Ujumbe } from '@/components/ui/ujumbe';

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo weave />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-5 py-10">
        <p className="font-display text-primary text-xl">SokoFashion</p>

        <section className="kanga-frame bg-paper flex flex-col gap-6 p-8 sm:p-10">
          <h1 className="font-display text-display text-ink">Your shop, one link you can share</h1>
          <p className="text-ink-soft max-w-prose text-lg">
            Put your clothes, shoes and bags in one tidy shop. Share it on WhatsApp Status. Keep
            every order and every M-Pesa code in one place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={buttonClasses('primary')}>
              Create your shop
            </Link>
            <Link href="/login" className={buttonClasses('secondary')}>
              Log in
            </Link>
            <Link href="/browse" className={buttonClasses('secondary')}>
              Browse all shops
            </Link>
          </div>
        </section>

        <Ujumbe
          saying="Haba na haba hujaza kibaba."
          meaning="Little by little fills the measure."
        />
      </main>
    </div>
  );
}
