import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { signOutAction } from '@/features/auth/actions';
import { formatMoney } from '@/features/catalogue/money';
import { formatWhen } from '@/features/orders/format';
import { getShopOrders, releaseExpiredOrders } from '@/features/orders/seller-queries';
import {
  ORDER_STATUSES,
  parseStatusFilter,
  statusLabels,
  statusTones,
} from '@/features/orders/status';
import { findMemberShop } from '@/features/shops/access';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Orders' };

type OrdersPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { slug } = await params;
  const { status: statusText } = await searchParams;
  if (!SHOP_LINK_PATTERN.test(slug)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/login');
  }

  /* Someone who is not on this shop's team gets the same not found page as for a missing shop */
  const found = await findMemberShop(supabase, slug);
  if (!found) {
    notFound();
  }
  const { shop } = found;

  const filter = parseStatusFilter(statusText);

  /* Orders whose 24 hours ran out give their stock back before the list is read */
  await releaseExpiredOrders(supabase, shop.id);
  const orders = await getShopOrders(supabase, shop.id, filter);
  const units = await getCurrencyMinorUnits(orders[0]?.currency_code ?? 'KES');

  const base = `/dashboard/orders/${shop.slug}`;
  const filters = [
    { label: 'All', href: base, active: filter === null },
    ...ORDER_STATUSES.map((status) => ({
      label: statusLabels[status],
      href: `${base}?status=${status}`,
      active: filter === status,
    })),
  ];

  return (
    <AppShell
      title="Orders"
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      <p className="text-ink-soft text-base">
        Orders for {shop.name}. An order that is not paid within 24 hours expires and its items go
        back on sale.
      </p>

      <nav aria-label="Filter orders" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={buttonClasses(item.active ? 'primary' : 'secondary', 'min-h-11 px-4')}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders here yet"
          description="When a buyer places an order from your shop, it shows up here."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`${base}/${order.id}`}
                    className="font-display text-title text-primary underline underline-offset-4"
                  >
                    {order.reference}
                  </Link>
                  <Badge tone={statusTones[order.status]}>{statusLabels[order.status]}</Badge>
                </div>
                <p className="text-ink text-base">{order.buyer_name}</p>
                <p className="text-ink text-lg font-semibold">
                  {formatMoney(order.total_minor, order.currency_code, units)}
                </p>
                <p className="text-ink-soft text-sm">
                  {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}, placed{' '}
                  {formatWhen(order.created_at)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
