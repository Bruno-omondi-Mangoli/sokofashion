/*
 * Money helpers. Prices are stored as whole numbers in the smallest unit, so
 * 1500 shillings is 150000 when the currency has 2 decimal places. These
 * functions never use floating point numbers, because they can round wrongly.
 */

export const MAX_PRICE_MINOR = 100000000;

/*
 * Turns what a seller typed, such as "1,500" or "1500.50", into whole minor
 * units. Returns null for anything that is not a clear, valid price.
 */
export function toMinorUnits(text: string, minorUnits: number): number | null {
  const cleaned = text.trim().replace(/[,\s]/g, '');
  const match = /^(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) {
    return null;
  }

  const whole = match[1];
  const fraction = match[2] ?? '';
  if (fraction.length > minorUnits) {
    return null;
  }

  const minor = Number(`${whole}${fraction.padEnd(minorUnits, '0')}`);
  if (!Number.isSafeInteger(minor) || minor > MAX_PRICE_MINOR) {
    return null;
  }

  return minor;
}

/* Turns minor units into text for people, such as "KES 1,500" or "KES 1,500.50" */
export function formatMoney(minor: number, currencyCode: string, minorUnits: number): string {
  const divisor = 10 ** minorUnits;
  const whole = Math.floor(minor / divisor);
  const fraction = minor % divisor;
  const groupedWhole = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (minorUnits === 0 || fraction === 0) {
    return `${currencyCode} ${groupedWhole}`;
  }

  return `${currencyCode} ${groupedWhole}.${String(fraction).padStart(minorUnits, '0')}`;
}
