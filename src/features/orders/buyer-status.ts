import type { OrderStatus } from './status';

/* What each status means for a buyer, in plain words */
export const buyerStatusText: Record<OrderStatus, string> = {
  awaiting_payment:
    'Your items are being kept for you until the time shown below. Contact the shop to pay.',
  paid: 'The shop has received your payment.',
  completed: 'This order is complete.',
  cancelled: 'The shop cancelled this order. Contact the shop if you did not expect this.',
  expired: 'This order was not paid in time, so its items went back on sale. You can order again.',
};
