'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { countItems } from './cart-logic';
import { useCart } from './use-cart';

/* A bar at the bottom of public pages once the cart has something in it */
export function CartBar() {
  const pathname = usePathname();
  const { lines, ready } = useCart();
  const count = countItems(lines);
  const onPublicPage = pathname.startsWith('/s/') || pathname === '/browse';

  if (!ready || count === 0 || !onPublicPage) {
    return null;
  }

  return (
    <>
      <div aria-hidden="true" className="h-20" />
      <div className="bg-paper border-hairline fixed inset-x-0 bottom-0 z-20 border-t p-3">
        <div className="mx-auto max-w-2xl">
          <Link href="/cart" className={buttonClasses('primary', 'w-full')}>
            View cart, {count} {count === 1 ? 'item' : 'items'}
          </Link>
        </div>
      </div>
    </>
  );
}
