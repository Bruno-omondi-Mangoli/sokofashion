'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/features/catalogue/money';
import {
  DIMENSION_LABEL,
  defaultSelection,
  dimensionsUsed,
  findVariant,
  optionsFor,
  type Selection,
} from './picker';
import type { PublicVariant } from './schemas';

type VariantPickerProps = {
  variants: PublicVariant[];
  currencyCode: string;
  minorUnits: number;
};

/*
 * Lets the buyer choose a size, colour or shade and shows the price and whether
 * that combination is in stock. It only helps the buyer look. Price and stock
 * always come from the database.
 */
export function VariantPicker({ variants, currencyCode, minorUnits }: VariantPickerProps) {
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(variants));
  const dimensions = dimensionsUsed(variants);
  const chosen = findVariant(variants, selection);

  return (
    <div className="flex flex-col gap-4">
      {dimensions.map((dimension) => (
        <fieldset key={dimension} className="flex flex-col gap-2">
          <legend className="text-ink text-base font-semibold">{DIMENSION_LABEL[dimension]}</legend>
          <div className="flex flex-wrap gap-2">
            {optionsFor(variants, dimension).map((option) => {
              const selected = selection[dimension] === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelection((current) => ({ ...current, [dimension]: option }))}
                  className={
                    selected
                      ? 'bg-primary text-on-primary min-h-11 min-w-11 rounded-full px-4 text-base font-semibold'
                      : 'bg-paper text-ink border-hairline min-h-11 min-w-11 rounded-full border px-4 text-base font-semibold'
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div role="status" className="flex items-center justify-between gap-3">
        {chosen ? (
          <>
            <span className="text-ink text-lg font-semibold">
              {formatMoney(chosen.price_minor, currencyCode, minorUnits)}
            </span>
            <Badge tone={chosen.in_stock ? 'positive' : 'muted'}>
              {chosen.in_stock ? 'In stock' : 'Sold out'}
            </Badge>
          </>
        ) : (
          <p className="text-ink-soft text-base">
            This combination is not available. Please pick another.
          </p>
        )}
      </div>
    </div>
  );
}
