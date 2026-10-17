'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { slugify } from './slug';
import { initialShopFormState, type Country, type ShopFormState } from './types';

type CreateShopFormProps = {
  action: (state: ShopFormState, formData: FormData) => Promise<ShopFormState>;
  countries: Country[];
  appUrl: string;
};

export function CreateShopForm({ action, countries, appUrl }: CreateShopFormProps) {
  const [state, formAction, pending] = useActionState(action, initialShopFormState);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [countryCode, setCountryCode] = useState(countries[0]?.code ?? '');

  function handleNameChange(value: string) {
    setName(value);
    /* Keep suggesting a link name until the seller types their own */
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase());
    setSlugEdited(true);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        label="Shop name"
        name="name"
        type="text"
        required
        minLength={2}
        maxLength={80}
        value={name}
        onChange={(event) => handleNameChange(event.target.value)}
      />

      <TextField
        label="Link name"
        name="slug"
        type="text"
        required
        minLength={3}
        maxLength={40}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={slug}
        onChange={(event) => handleSlugChange(event.target.value)}
        hint={`Your shop link will be ${appUrl}/${slug || 'your-shop'}`}
      />

      <SelectField
        label="Country"
        name="countryCode"
        required
        value={countryCode}
        onChange={(event) => setCountryCode(event.target.value)}
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </SelectField>

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" disabled={pending || countries.length === 0} className="w-full">
        {pending ? 'Creating your shop' : 'Create my shop'}
      </Button>
    </form>
  );
}
