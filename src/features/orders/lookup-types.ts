import type { LookedUpOrder } from './lookup-schemas';

export type LookupResponse =
  | { ok: true; order: LookedUpOrder; minorUnits: number; whatsappPhone: string | null }
  | { ok: false; message: string };
