import type { ReactNode } from 'react';

/* The standard container for a block of related content on a sand page */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-paper border-hairline flex flex-col gap-3 rounded-xl border p-5">
      {children}
    </div>
  );
}
