export type DeliveryMode = 'pickup_only' | 'free_delivery' | 'paid_delivery';
export type DeliveryChoice = 'pickup' | 'delivery';

/* A pickup only shop does not offer delivery at all */
export function deliveryOffered(mode: DeliveryMode): boolean {
  return mode !== 'pickup_only';
}

/*
 * The fee shown to the buyer before ordering. It is a preview only. The
 * database works out the real fee from the shop setting when the order is placed.
 */
export function previewFee(mode: DeliveryMode, feeMinor: number, choice: DeliveryChoice): number {
  if (choice !== 'delivery') {
    return 0;
  }
  return mode === 'paid_delivery' ? feeMinor : 0;
}

export const modeLabels: Record<DeliveryMode, string> = {
  pickup_only: 'Pickup only',
  free_delivery: 'Free delivery',
  paid_delivery: 'Paid delivery',
};
