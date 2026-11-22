import type { LookedUpOrder } from './lookup-schemas';

export type LookupResponse =
  { ok: true; order: LookedUpOrder; minorUnits: number } | { ok: false; message: string };
