import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Pindo } from './pindo';

type AppShellProps = {
  title: string;
  userEmail: string;
  signOut: () => Promise<void>;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/*
 * The frame for every signed in page: border band, a top bar with the brand and
 * a sign out button, then the page title and content. The bar stays calm so the
 * work in front of the seller is what stands out.
 */
export function AppShell({
  title,
  userEmail,
  signOut,
  backHref,
  backLabel = 'Back',
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <header className="bg-paper border-hairline border-b">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/dashboard" className="font-display text-primary text-xl">
            SokoFashion
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="text-primary hover:text-primary-strong inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4"
            >
              {backLabel}
            </Link>
          ) : null}
          <h1 className="font-display text-title text-ink">{title}</h1>
          <p className="text-ink-soft text-sm">Signed in as {userEmail}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
