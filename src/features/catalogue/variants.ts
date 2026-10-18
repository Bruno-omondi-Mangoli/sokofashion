/*
 * Builds the list of variants from the sizes and colours a seller chose. Two
 * sizes and three colours make six variants. If only one list is filled, the
 * other option stays empty. If both are empty, there is one plain variant.
 */

export const MAX_VARIANTS = 50;

export type VariantOptions = {
  size: string | null;
  colour: string | null;
};

/* Trims, drops empty values, and removes repeats ignoring letter case. The first spelling wins. */
function cleanList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (trimmed !== '' && !seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

export function buildVariantGrid(sizes: string[], colours: string[]): VariantOptions[] {
  const cleanSizes = cleanList(sizes);
  const cleanColours = cleanList(colours);

  if (cleanSizes.length === 0 && cleanColours.length === 0) {
    return [{ size: null, colour: null }];
  }
  if (cleanColours.length === 0) {
    return cleanSizes.map((size) => ({ size, colour: null }));
  }
  if (cleanSizes.length === 0) {
    return cleanColours.map((colour) => ({ size: null, colour }));
  }

  return cleanSizes.flatMap((size) => cleanColours.map((colour) => ({ size, colour })));
}

/* A stable key for one variant, used to match stock quantities to variants */
export function variantKey(size: string | null, colour: string | null): string {
  return `${(size ?? '').trim().toLowerCase()}|${(colour ?? '').trim().toLowerCase()}`;
}

/* Human readable name of a variant, such as "M, Red" */
export function variantLabel(options: VariantOptions): string {
  const parts = [options.size, options.colour].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(', ') : 'One size';
}
