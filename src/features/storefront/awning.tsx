import type { ReactNode } from 'react';
import { stallTone } from './stall';

/* The cloth edge of a shop stall. Put the shop name inside it. */
export function Awning({ slug, children }: { slug: string; children: ReactNode }) {
  return <div className={`awning awning-${stallTone(slug)}`}>{children}</div>;
}
