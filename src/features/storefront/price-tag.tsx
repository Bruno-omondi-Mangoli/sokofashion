import type { ReactNode } from 'react';

/* A price on a hang tag. A sold out tag turns grey and is struck through. */
export function PriceTag({ soldOut, children }: { soldOut: boolean; children: ReactNode }) {
  return (
    <span className={`price-tag ${soldOut ? 'price-tag-sold' : 'price-tag-live'} text-lg`}>
      {children}
    </span>
  );
}
