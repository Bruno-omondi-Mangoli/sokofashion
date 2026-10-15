'use client';

import { useActionState, useState } from 'react';
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
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Shop name
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="min-h-12 rounded-md border border-neutral-400 px-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Link name
        <input
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
          className="min-h-12 rounded-md border border-neutral-400 px-3 text-base"
        />
        <span className="text-xs font-normal text-neutral-700">
          Your shop link will be {appUrl}/{slug || 'your-shop'}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Country
        <select
          name="countryCode"
          required
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className="min-h-12 rounded-md border border-neutral-400 bg-white px-3 text-base"
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || countries.length === 0}
        className="min-h-12 rounded-md bg-neutral-900 px-4 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Creating your shop' : 'Create my shop'}
      </button>
    </form>
  );
}
