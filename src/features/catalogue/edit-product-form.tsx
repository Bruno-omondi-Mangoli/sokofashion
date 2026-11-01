'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { initialProductFormState, type Category, type ProductFormState } from './types';

type EditProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  slug: string;
  productId: string;
  categories: Category[];
  currencyCode: string;
  initial: {
    name: string;
    categoryCode: string;
    priceText: string;
    description: string;
  };
};

export function EditProductForm({
  action,
  slug,
  productId,
  categories,
  currencyCode,
  initial,
}: EditProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialProductFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="productId" value={productId} />

      <TextField
        label="Product name"
        name="name"
        type="text"
        required
        minLength={2}
        maxLength={120}
        defaultValue={initial.name}
      />

      <SelectField label="Category" name="category" required defaultValue={initial.categoryCode}>
        {categories.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label={`Price in ${currencyCode}`}
        name="price"
        type="text"
        inputMode="decimal"
        required
        defaultValue={initial.priceText}
        hint="This is the price for every size and colour."
      />

      <TextAreaField
        label="Description (optional)"
        name="description"
        maxLength={2000}
        defaultValue={initial.description}
      />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving' : 'Save changes'}
      </Button>
    </form>
  );
}
