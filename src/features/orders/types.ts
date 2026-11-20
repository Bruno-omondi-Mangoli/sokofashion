import type { PlacedOrder } from './schemas';

export type PlaceOrderResponse = { ok: true; order: PlacedOrder } | { ok: false; message: string };
