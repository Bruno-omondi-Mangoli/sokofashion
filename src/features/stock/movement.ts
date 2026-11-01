/*
 * The kinds of stock change a seller can record by hand, in everyday words, and
 * how each one turns into a ledger entry. The database has the final say, for
 * example it never lets stock go below zero.
 */

export type MovementKind = 'restock' | 'return' | 'found' | 'lost' | 'damage';
export type LedgerReason = 'restock' | 'sale_return' | 'adjustment' | 'damage';

export const movementKinds: ReadonlyArray<{
  value: MovementKind;
  label: string;
  needsNote: boolean;
}> = [
  { value: 'restock', label: 'New stock arrived', needsNote: false },
  { value: 'return', label: 'A customer returned an item', needsNote: false },
  { value: 'damage', label: 'Damaged or spoiled', needsNote: false },
  { value: 'found', label: 'Count correction: I have more than recorded', needsNote: true },
  { value: 'lost', label: 'Count correction: I have less than recorded', needsNote: true },
];

export const movementKindValues = ['restock', 'return', 'found', 'lost', 'damage'] as const;

export function kindNeedsNote(kind: MovementKind): boolean {
  return movementKinds.find((entry) => entry.value === kind)?.needsNote ?? false;
}

/* Turns a kind and a positive quantity into the signed change and the ledger reason */
export function toMovement(
  kind: MovementKind,
  quantity: number,
): { changeAmount: number; reason: LedgerReason } {
  switch (kind) {
    case 'restock':
      return { changeAmount: quantity, reason: 'restock' };
    case 'return':
      return { changeAmount: quantity, reason: 'sale_return' };
    case 'found':
      return { changeAmount: quantity, reason: 'adjustment' };
    case 'lost':
      return { changeAmount: -quantity, reason: 'adjustment' };
    case 'damage':
      return { changeAmount: -quantity, reason: 'damage' };
  }
}

/* Words for each ledger reason, for the history list */
export const reasonLabels: Record<string, string> = {
  opening: 'Opening stock',
  restock: 'New stock arrived',
  sale: 'Sale',
  sale_return: 'Customer return',
  adjustment: 'Count correction',
  damage: 'Damaged or spoiled',
  reversal: 'Undone',
};

/* Reasons an owner or manager may undo by hand. Sales are undone by cancelling the order. */
export const undoableReasons = ['opening', 'restock', 'sale_return', 'adjustment', 'damage'];

/* A readable name for a variant, such as "M, Red" or "Plum" */
export function variantName(options: {
  size: string | null;
  colour: string | null;
  shade: string | null;
}): string {
  const parts = [options.size, options.colour, options.shade].filter(
    (part): part is string => part !== null && part !== '',
  );
  return parts.length > 0 ? parts.join(', ') : 'One size';
}
