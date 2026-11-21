import type { BadgeTone } from '@/components/ui/badge';

export const ORDER_STATUSES = [
  'awaiting_payment',
  'paid',
  'completed',
  'cancelled',
  'expired',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabels: Record<OrderStatus, string> = {
  awaiting_payment: 'Waiting for payment',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/* Marigold means waiting, green means money received, grey means finished without a sale */
export const statusTones: Record<OrderStatus, BadgeTone> = {
  awaiting_payment: 'owner',
  paid: 'positive',
  completed: 'positive',
  cancelled: 'muted',
  expired: 'muted',
};

/* Turns the status in the address into a known status, or null for anything else */
export function parseStatusFilter(text: string | undefined): OrderStatus | null {
  return ORDER_STATUSES.find((status) => status === text) ?? null;
}
