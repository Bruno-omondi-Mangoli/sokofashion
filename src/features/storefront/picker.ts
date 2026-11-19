import type { PublicVariant } from './schemas';

export type Dimension = 'size' | 'colour' | 'shade';
export type Selection = Partial<Record<Dimension, string>>;

export const DIMENSIONS: Dimension[] = ['size', 'colour', 'shade'];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  size: 'Size',
  colour: 'Colour',
  shade: 'Shade',
};

/* The product id in the address must look like an id before the database is asked */
export const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* Which choices this product really has. A tote bag has only colours, a sandal has sizes and colours. */
export function dimensionsUsed(variants: PublicVariant[]): Dimension[] {
  return DIMENSIONS.filter((dimension) => variants.some((variant) => variant[dimension] !== null));
}

/* Every different value for one choice, in the order the seller created them */
export function optionsFor(variants: PublicVariant[], dimension: Dimension): string[] {
  const seen: string[] = [];
  for (const variant of variants) {
    const value = variant[dimension];
    if (value !== null && !seen.includes(value)) {
      seen.push(value);
    }
  }
  return seen;
}

/* Start on the first variant that is in stock, so the buyer lands on something they can buy */
export function defaultSelection(variants: PublicVariant[]): Selection {
  const first = variants.find((variant) => variant.in_stock) ?? variants[0];
  const selection: Selection = {};
  if (!first) {
    return selection;
  }
  for (const dimension of dimensionsUsed(variants)) {
    const value = first[dimension];
    if (value !== null) {
      selection[dimension] = value;
    }
  }
  return selection;
}

/* The variant that matches every choice, or null when that combination does not exist */
export function findVariant(variants: PublicVariant[], selection: Selection): PublicVariant | null {
  const dimensions = dimensionsUsed(variants);
  return (
    variants.find((variant) =>
      dimensions.every((dimension) => variant[dimension] === (selection[dimension] ?? null)),
    ) ?? null
  );
}
