import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/features/catalogue/money';
import { buyerStatusText } from './buyer-status';
import { formatWhen, shopWhatsappLink } from './format';
import type { LookedUpOrder } from './lookup-schemas';
import { statusLabels, statusTones } from './status';

/* The buyer's receipt. Everything is plain text, and the phone number is never shown. */
export function OrderReceipt({
  order,
  minorUnits,
  whatsappPhone = null,
}: {
  order: LookedUpOrder;
  minorUnits: number;
  whatsappPhone?: string | null;
}) {
  const whatsapp = whatsappPhone ? shopWhatsappLink(whatsappPhone, order.reference) : null;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-title text-primary">{order.reference}</h2>
        <Badge tone={statusTones[order.status]}>{statusLabels[order.status]}</Badge>
      </div>
      <p className="text-ink text-base">{buyerStatusText[order.status]}</p>
      <p className="text-ink-soft text-sm">
        From {order.shop.name}. Placed {formatWhen(order.created_at)}.
        {order.status === 'awaiting_payment' ? ` Kept until ${formatWhen(order.expires_at)}.` : ''}
      </p>

      <ul className="flex flex-col gap-2">
        {order.items.map((item, index) => (
          <li
            key={`${item.product_name}-${item.variant_label}-${index}`}
            className="flex justify-between gap-3 text-base"
          >
            <span className="text-ink">
              {item.quantity} x {item.product_name} ({item.variant_label})
            </span>
            <span className="text-ink font-semibold">
              {formatMoney(item.unit_price_minor * item.quantity, order.currency_code, minorUnits)}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-ink text-base">
        Items: {formatMoney(order.subtotal_minor, order.currency_code, minorUnits)}
      </p>
      <p className="text-ink text-base">
        {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}:{' '}
        {formatMoney(order.delivery_fee_minor, order.currency_code, minorUnits)}
      </p>
      <p className="text-ink text-lg font-semibold">
        Total: {formatMoney(order.total_minor, order.currency_code, minorUnits)}
      </p>
      {order.delivery_note ? (
        <p className="text-ink-soft text-sm whitespace-pre-line">
          Deliver to: {order.delivery_note}
        </p>
      ) : null}

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('primary', 'w-full')}
        >
          Tell the shop on WhatsApp
        </a>
      ) : null}

      <Link href={`/s/${order.shop.slug}`} className={buttonClasses('secondary', 'w-full')}>
        Back to {order.shop.name}
      </Link>
    </Card>
  );
}
