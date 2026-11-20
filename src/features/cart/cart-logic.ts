import {
  MAX_LINES_PER_SHOP,
  MAX_LINES_TOTAL,
  MAX_QUANTITY,
  cartLineSchema,
  storedEnvelopeSchema,
  type CartLine,
} from './schemas';

export type AddResult = { lines: CartLine[]; status: 'added' | 'full' };

/* Adds a line. The same variant twice becomes one line with a bigger quantity, up to the limit. */
export function addLine(lines: CartLine[], incoming: CartLine): AddResult {
  const clean: CartLine = {
    ...incoming,
    shopName: incoming.shopName.slice(0, 120),
    productName: incoming.productName.slice(0, 200),
    variantLabel: incoming.variantLabel.slice(0, 200),
    quantity: Math.min(Math.max(incoming.quantity, 1), MAX_QUANTITY),
  };

  const existing = lines.find((line) => line.variantId === clean.variantId);
  if (existing) {
    const quantity = Math.min(existing.quantity + clean.quantity, MAX_QUANTITY);
    return {
      lines: lines.map((line) => (line === existing ? { ...clean, quantity } : line)),
      status: 'added',
    };
  }

  const forThisShop = lines.filter((line) => line.shopSlug === clean.shopSlug).length;
  if (forThisShop >= MAX_LINES_PER_SHOP || lines.length >= MAX_LINES_TOTAL) {
    return { lines, status: 'full' };
  }
  return { lines: [...lines, clean], status: 'added' };
}

/* Zero or less removes the line. More than the limit is cut to the limit. */
export function setQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return removeLine(lines, variantId);
  }
  const capped = Math.min(Math.floor(quantity), MAX_QUANTITY);
  return lines.map((line) => (line.variantId === variantId ? { ...line, quantity: capped } : line));
}

export function removeLine(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((line) => line.variantId !== variantId);
}

export function clearShop(lines: CartLine[], shopSlug: string): CartLine[] {
  return lines.filter((line) => line.shopSlug !== shopSlug);
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export type ShopGroup = {
  shopSlug: string;
  shopName: string;
  lines: CartLine[];
  subtotalMinor: number;
  currencyCode: string;
  minorUnits: number;
};

/* One group per shop, in the order the shops first appear. Checkout always stays with one shop (D058). */
export function groupByShop(lines: CartLine[]): ShopGroup[] {
  const groups: ShopGroup[] = [];
  for (const line of lines) {
    let group = groups.find((candidate) => candidate.shopSlug === line.shopSlug);
    if (!group) {
      group = {
        shopSlug: line.shopSlug,
        shopName: line.shopName,
        lines: [],
        subtotalMinor: 0,
        currencyCode: line.currencyCode,
        minorUnits: line.minorUnits,
      };
      groups.push(group);
    }
    group.lines.push(line);
    group.subtotalMinor += line.priceMinor * line.quantity;
  }
  return groups;
}

/* Reads what the browser stored. Anything wrong is dropped, and the good lines stay. */
export function parseStoredCart(text: string | null): CartLine[] {
  if (!text) {
    return [];
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  const envelope = storedEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return [];
  }

  const lines: CartLine[] = [];
  for (const item of envelope.data.lines) {
    const parsed = cartLineSchema.safeParse(item);
    if (parsed.success && !lines.some((line) => line.variantId === parsed.data.variantId)) {
      lines.push(parsed.data);
    }
  }
  return lines;
}
