import { cn } from '@/lib/cn';

/*
 * The woven border band that signs every page. It is decoration only, so it is
 * hidden from screen readers. Use weave on one page only, because motion should
 * stay rare.
 */
export function Pindo({ weave = false }: { weave?: boolean }) {
  return <div aria-hidden="true" className={cn('pindo', weave && 'pindo-weave')} />;
}
