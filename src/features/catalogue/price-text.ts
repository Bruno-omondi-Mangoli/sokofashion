/*
 * Turns minor units back into the text a seller types, such as 350000 into
 * "3500" or 150050 into "1500.50". Used to fill the edit form. No floating
 * point numbers are used.
 */
export function toPriceText(minor: number, minorUnits: number): string {
  const divisor = 10 ** minorUnits;
  const whole = Math.floor(minor / divisor);
  const fraction = minor % divisor;

  if (minorUnits === 0 || fraction === 0) {
    return String(whole);
  }
  return `${whole}.${String(fraction).padStart(minorUnits, '0')}`;
}
