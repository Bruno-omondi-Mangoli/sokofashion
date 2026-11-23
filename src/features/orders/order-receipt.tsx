import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/features/catalogue/money';
import { PayForm } from '@/features/payments/pay-form';
import { buyerStatusText } from './buyer-status';
import { formatWhen, shopWhatsappLink } from './format';
import type { LookedUpOrder } from './lookup-schemas';
import { statusLabels, statusTones } from './status';

type OrderReceiptProps = {
  order: LookedUpOrder;
  minorUnits: number;
  whatsappPhone: string | null;
  buyerPhone: string;
  onPaymentSent: () => void;
};

/* The buyer's receipt. Everything is plain text, and the phone number is never shown. */
export function OrderReceipt({
  order,
  minorUnits,
  whatsappPhone,
  buyerPhone,
  onPaymentSent,
}: OrderReceiptProps) {
  const whatsapp = whatsappPhone ? shopWhatsappLink(whatsappPhone, order.reference) : null;
  const canPay = order.status === 'awaiting_payment' && order.payment_status !== 'pending';

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

      {order.status === 'awaiting_payment' && order.payment_status === 'pending' ? (
        <Alert tone="info">
          Your M-Pesa code was sent. The shop is checking it. Check back here to see when your order
          is marked paid.
        </Alert>
      ) : null}

      {canPay ? (
        <div className="flex flex-col gap-3">
          {order.payment_status === 'rejected' ? (
            <Alert tone="error">
              The shop could not match your last code. Check it and send it again, or contact the
              shop.
            </Alert>
          ) : null}
          <p className="text-ink text-base">
            Pay the shop with M-Pesa. The shop tells you where to send the money. Then type the code
            from the M-Pesa message here.
          </p>
          <PayForm reference={order.reference} phone={buyerPhone} onSent={onPaymentSent} />
        </div>
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
