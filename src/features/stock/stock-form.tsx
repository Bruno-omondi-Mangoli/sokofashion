'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { movementKinds } from './movement';
import { initialStockFormState, type StockFormState } from './types';

type StockFormProps = {
  action: (state: StockFormState, formData: FormData) => Promise<StockFormState>;
  slug: string;
  productId: string;
  variants: Array<{ id: string; name: string }>;
};

export function StockForm({ action, slug, productId, variants }: StockFormProps) {
  const [state, formAction, pending] = useActionState(action, initialStockFormState);
  const formRef = useRef<HTMLFormElement>(null);

  /* After a saved change, clear the boxes so the next change starts fresh */
  useEffect(() => {
    if (state.notice) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="productId" value={productId} />

      <SelectField label="Which one?" name="variantId" required>
        {variants.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="What happened?" name="kind" required defaultValue="restock">
        {movementKinds.map((kind) => (
          <option key={kind.value} value={kind.value}>
            {kind.label}
          </option>
        ))}
      </SelectField>

      <TextField
        label="How many?"
        name="quantity"
        type="text"
        inputMode="numeric"
        required
        placeholder="0"
        hint="A whole number. The change is added to or taken from the stock for you."
      />

      <TextField
        label="Note (needed for count corrections)"
        name="note"
        type="text"
        maxLength={200}
        hint="For example: counted the shelf again on Monday."
      />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving' : 'Save stock change'}
      </Button>
    </form>
  );
}
