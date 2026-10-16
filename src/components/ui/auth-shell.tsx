import Link from 'next/link';
import type { ReactNode } from 'react';
import { Pindo } from './pindo';
import { Ujumbe, type UjumbeText } from './ujumbe';

type AuthShellProps = {
  title: string;
  intro?: string;
  saying?: UjumbeText;
  children: ReactNode;
};

/* The frame shared by every sign in page: border band, brand name, title, content, saying */
export function AuthShell({ title, intro, saying, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
        <Link href="/" className="font-display text-primary text-xl">
          SokoFashion
        </Link>
        <h1 className="font-display text-title text-ink">{title}</h1>
        {intro ? <p className="text-ink-soft text-base">{intro}</p> : null}
        {children}
        {saying ? <Ujumbe saying={saying.saying} meaning={saying.meaning} /> : null}
      </main>
    </div>
  );
}
