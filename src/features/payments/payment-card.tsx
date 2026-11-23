import { Alert } from '@/components/ui/alert';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/features/catalogue/money';
import { formatWhen } from '@/features/orders/format';
import type { OrderStatus } from '@/features/orders/status';
import type { PaymentRow, PaymentStatus } from './schemas';
import { confirmPaymentAction, rejectPaymentAction } from './seller-actions';

const labels: Record<PaymentStatus, string> = {
  pending: 'Waiting for you',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
};

const tones: Record<PaymentStatus, BadgeTone> = {
  pending: 'owner',
  confirmed: 'positive',
  rejected: 'muted',
};

type PaymentCardProps = {
  payments: PaymentRow[];
  order: { id: string; status: OrderStatus; total_minor: number; currency_code: string };
  slug: string;
  units: number;
  problem?: string;
};

/*
 * M-Pesa codes for one order. The team member finds the code in their M-Pesa
 * messages, reads the amount, and types it. The database marks the order paid
 * only when that amount equals the order total.
 */
export function PaymentCard({ payments, order, slug, units, problem }: PaymentCardProps) {
  const waiting = payments.find((payment) => payment.status === 'pending');
  const open = order.status === 'awaiting_payment';

  return (
    <Card>
      <h2 className="font-display text-title text-ink">M-Pesa payment</h2>

      {problem === 'amount' ? (
        <Alert tone="error">
          That amount does not match the order total, so the order was not marked paid. Check the
          M-Pesa message again. If the money did not arrive in full, reject the code.
        </Alert>
      ) : null}
      {problem === 'amountformat' ? (
        <Alert tone="error">Please type the amount from the M-Pesa message, such as 1500.</Alert>
      ) : null}
      {problem === 'payment' ? (
        <Alert tone="error">
          That did not work. The code may already be decided, or the order is no longer waiting for
          payment.
        </Alert>
      ) : null}

      {open && waiting ? (
        <div className="flex flex-col gap-3">
          <p className="text-ink-soft text-base">
            The buyer sent this M-Pesa code {formatWhen(waiting.submitted_at)}:
          </p>
          <p className="font-display text-title text-primary tracking-wide">{waiting.mpesa_code}</p>
          <p className="text-ink text-base">
            Open your M-Pesa messages, find this code, and read the amount. Type that amount below.
            The order is marked paid only if it equals{' '}
            {formatMoney(order.total_minor, order.currency_code, units)}.
          </p>
          <form action={confirmPaymentAction} className="flex flex-col gap-3">
            <input type="hidden" name="paymentId" value={waiting.id} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="slug" value={slug} />
            <label className="flex flex-col gap-1 text-base font-semibold">
              Amount in the M-Pesa message ({order.currency_code})
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                required
                maxLength={20}
                placeholder="1500"
                className="bg-paper text-ink border-line min-h-12 w-full rounded-lg border px-4 text-base font-normal"
              />
            </label>
            <button type="submit" className={buttonClasses('primary', 'w-full')}>
              The amount matches, mark as paid
            </button>
          </form>
          <form action={rejectPaymentAction}>
            <input type="hidden" name="paymentId" value={waiting.id} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="slug" value={slug} />
            <button type="submit" className={buttonClasses('secondary', 'w-full')}>
              I did not receive this payment, reject the code
            </button>
          </form>
        </div>
      ) : null}

      {open && !waiting ? (
        <p className="text-ink-soft text-base">
          No code yet. After the buyer pays, they enter the M-Pesa code from their order page and it
          shows here.
        </p>
      ) : null}

      {payments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-2 text-base"
            >
              <span className="text-ink">
                {payment.mpesa_code}
                {payment.amount_minor !== null
                  ? `, ${formatMoney(payment.amount_minor, order.currency_code, units)}`
                  : ''}
              </span>
              <Badge tone={tones[payment.status]}>{labels[payment.status]}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
