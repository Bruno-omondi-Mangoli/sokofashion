/* The same shape place_order builds: SF, a hyphen, and six characters without I, L, O, 0 or 1 */
export const ORDER_REFERENCE_PATTERN = /^SF-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/;

export function normalizeReference(text: string): string {
  return text.trim().toUpperCase();
}

export function isOrderReference(text: string): boolean {
  return ORDER_REFERENCE_PATTERN.test(normalizeReference(text));
}
