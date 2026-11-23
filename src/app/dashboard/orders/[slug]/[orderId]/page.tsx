import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClasses, linkClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { formatMoney } from '@/features/catalogue/money';
import { formatPhone, formatWhen, whatsappLink } from '@/features/orders/format';
import { cancelOrderAction } from '@/features/orders/seller-actions';
import { getOrderDetail, releaseExpiredOrders } from '@/features/orders/seller-queries';
import { statusLabels, statusTones } from '@/features/orders/status';
import { PaymentCard } from '@/features/payments/payment-card';
import { getOrderPayments } from '@/features/payments/queries';
import { findMemberShop } from '@/features/shops/access';
import { PRODUCT_ID_PATTERN } from '@/features/storefront/picker';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Order' };

type OrderPageProps = {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { slug, orderId } = await params;
  const { saved, problem } = await searchParams;
  if (!SHOP_LINK_PATTERN.test(slug) || !PRODUCT_ID_PATTERN.test(orderId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/login');
  }

  const found = await findMemberShop(supabase, slug);
  if (!found) {
    notFound();
  }
  const { shop } = found;

  await releaseExpiredOrders(supabase, shop.id);
  const detail = await getOrderDetail(supabase, shop.id, orderId);
  if (!detail) {
    notFound();
  }
  const { order, items } = detail;
  const units = await getCurrencyMinorUnits(order.currency_code);
  const whatsapp = whatsappLink(order.buyer_phone);
  const payments = await getOrderPayments(supabase, order.id);

  /* Only used to decide what to show. The database refuses everybody else. */
  const canCancel =
    (shop.role === 'owner' || shop.role === 'manager') && order.status === 'awaiting_payment';

  return (
    <AppShell
      title={order.reference}
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref={`/dashboard/orders/${shop.slug}`}
      backLabel="Back to orders"
    >
      {saved ? <Alert tone="success">Saved.</Alert> : null}
      {problem === 'changed' ? (
        <Alert tone="error">
          This order is no longer waiting for payment, so it cannot be cancelled.
        </Alert>
      ) : null}
      {problem === '1' ? (
        <Alert tone="error">
          That did not work. Only the owner or a manager can cancel an order.
        </Alert>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-title text-ink">{order.buyer_name}</h2>
          <Badge tone={statusTones[order.status]}>{statusLabels[order.status]}</Badge>
        </div>
        <p className="text-ink text-base">{formatPhone(order.buyer_phone)}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`tel:+${order.buyer_phone}`}
            className={buttonClasses('secondary', 'w-full sm:w-auto')}
          >
            Call
          </a>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('secondary', 'w-full sm:w-auto')}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
        <p className="text-ink-soft text-sm">
          {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}. Placed{' '}
          {formatWhen(order.created_at)}.
          {order.status === 'awaiting_payment'
            ? ` Items are kept until ${formatWhen(order.expires_at)}.`
            : ''}
        </p>
        {order.delivery_note ? (
          <p className="text-ink text-base whitespace-pre-line">
            Deliver to: {order.delivery_note}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-display text-title text-ink">Items</h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-base">
              <span className="text-ink">
                {item.quantity} x {item.product_name} ({item.variant_label})
              </span>
              <span className="text-ink font-semibold">
                {formatMoney(item.unit_price_minor * item.quantity, order.currency_code, units)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-ink text-base">
          Items: {formatMoney(order.subtotal_minor, order.currency_code, units)}
        </p>
        <p className="text-ink text-base">
          Delivery: {formatMoney(order.delivery_fee_minor, order.currency_code, units)}
        </p>
        <p className="text-ink text-lg font-semibold">
          Total: {formatMoney(order.total_minor, order.currency_code, units)}
        </p>
      </Card>

      <PaymentCard
        payments={payments}
        order={{
          id: order.id,
          status: order.status,
          total_minor: order.total_minor,
          currency_code: order.currency_code,
        }}
        slug={shop.slug}
        units={units}
        problem={problem}
      />

      <Card>
        <h2 className="font-display text-title text-ink">Payment</h2>
        <p className="text-ink-soft text-base">
          Cancelling puts the items back on sale and closes any waiting M-Pesa code.
        </p>
        {canCancel ? (
          <form action={cancelOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            <button type="submit" className={buttonClasses('secondary', 'w-full')}>
              Cancel this order and put the items back on sale
            </button>
          </form>
        ) : order.status === 'awaiting_payment' ? (
          <p className="text-ink-soft text-base">
            Only the owner or a manager can cancel an order.
          </p>
        ) : null}
        <a href={`/dashboard/orders/${shop.slug}`} className={linkClasses}>
          Back to all orders
        </a>
      </Card>
    </AppShell>
  );
}
