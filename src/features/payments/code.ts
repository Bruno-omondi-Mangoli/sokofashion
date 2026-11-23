/* An M-Pesa code is 10 capital letters and digits, such as SGA4X9K2PQ. The database checks the same pattern. */
export const MPESA_CODE_PATTERN = /^[A-Z0-9]{10}$/;

export function normalizeMpesaCode(text: string): string {
  return text.trim().toUpperCase();
}

export function isMpesaCode(text: string): boolean {
  return MPESA_CODE_PATTERN.test(normalizeMpesaCode(text));
}
