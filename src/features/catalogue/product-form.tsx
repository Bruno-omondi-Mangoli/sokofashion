'use client';

import { useActionState, useMemo, useState, type KeyboardEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SelectField } from '@/components/ui/select-field';
import { fieldInputClasses, TextField } from '@/components/ui/text-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { colourPresets, sizeHelp, sizePresets } from '@/config/catalogue';
import { initialProductFormState, type Category, type ProductFormState } from './types';
import { buildVariantGrid, variantKey, variantLabel } from './variants';

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  shopId: string;
  slug: string;
  categories: Category[];
  currencyCode: string;
};

/* Adds or removes a value from a list, ignoring letter case */
function toggleValue(list: string[], value: string): string[] {
  const exists = list.some((item) => item.toLowerCase() === value.toLowerCase());
  return exists
    ? list.filter((item) => item.toLowerCase() !== value.toLowerCase())
    : [...list, value];
}

/* The preset choices followed by any custom values the seller added */
function choicesWithCustom(presets: string[], selected: string[]): string[] {
  const custom = selected.filter(
    (value) => !presets.some((preset) => preset.toLowerCase() === value.toLowerCase()),
  );
  return [...presets, ...custom];
}

export function ProductForm({ action, shopId, slug, categories, currencyCode }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialProductFormState);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.code ?? 'clothes');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [customColour, setCustomColour] = useState('');
  const [stock, setStock] = useState<Record<string, string>>({});

  /* Cosmetics are sold by shade, so they have no sizes */
  const isCosmetics = category === 'cosmetics';
  const sizeChoices = choicesWithCustom(sizePresets[category] ?? [], sizes);
  const colourChoices = choicesWithCustom(colourPresets, colours);

  const grid = useMemo(
    () => buildVariantGrid(isCosmetics ? [] : sizes, colours),
    [isCosmetics, sizes, colours],
  );

  function handleCategoryChange(value: string) {
    setCategory(value);
    setSizes([]);
    setStock({});
  }

  function addCustomSize() {
    const value = customSize.trim();
    if (value !== '' && !sizes.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setSizes([...sizes, value]);
    }
    setCustomSize('');
  }

  function addCustomColour() {
    const value = customColour.trim();
    if (value !== '' && !colours.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setColours([...colours, value]);
    }
    setCustomColour('');
  }

  /* Enter in a small add box adds the value and must not submit the whole form */
  function onEnter(event: KeyboardEvent<HTMLInputElement>, add: () => void) {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  }

  const payload = JSON.stringify({
    shopId,
    slug,
    name,
    category,
    price,
    description,
    sizes: isCosmetics ? [] : sizes,
    colours,
    stock: Object.fromEntries(
      grid.map((options) => {
        const key = variantKey(options.size, options.colour);
        return [key, Number(stock[key] ?? '') || 0];
      }),
    ),
  });

  const colourLabel = isCosmetics ? 'Shades' : 'Colours';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="payload" value={payload} />

      <TextField
        label="Product name"
        type="text"
        required
        minLength={2}
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <SelectField
        label="Category"
        required
        value={category}
        onChange={(event) => handleCategoryChange(event.target.value)}
      >
        {categories.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label={`Price in ${currencyCode}`}
        type="text"
        inputMode="decimal"
        required
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        hint="For example 1500. This is the price for every size and colour."
      />

      <TextAreaField
        label="Description (optional)"
        maxLength={2000}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      {isCosmetics ? null : (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-ink text-sm font-semibold">Sizes</legend>
          {category === 'clothes' ? <p className="text-ink-soft text-sm">{sizeHelp}</p> : null}
          <div className="flex flex-wrap gap-2">
            {sizeChoices.map((value) => (
              <Chip
                key={value}
                selected={sizes.some((item) => item.toLowerCase() === value.toLowerCase())}
                onToggle={() => setSizes(toggleValue(sizes, value))}
              >
                {value}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Add another size"
              placeholder="Another size"
              maxLength={20}
              value={customSize}
              onChange={(event) => setCustomSize(event.target.value)}
              onKeyDown={(event) => onEnter(event, addCustomSize)}
              className={`${fieldInputClasses(false)} min-w-0 flex-1`}
            />
            <Button type="button" variant="secondary" onClick={addCustomSize}>
              Add
            </Button>
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-ink text-sm font-semibold">{colourLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {colourChoices.map((value) => (
            <Chip
              key={value}
              selected={colours.some((item) => item.toLowerCase() === value.toLowerCase())}
              onToggle={() => setColours(toggleValue(colours, value))}
            >
              {value}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label={`Add another ${isCosmetics ? 'shade' : 'colour'}`}
            placeholder={isCosmetics ? 'Another shade' : 'Another colour'}
            maxLength={30}
            value={customColour}
            onChange={(event) => setCustomColour(event.target.value)}
            onKeyDown={(event) => onEnter(event, addCustomColour)}
            className={`${fieldInputClasses(false)} min-w-0 flex-1`}
          />
          <Button type="button" variant="secondary" onClick={addCustomColour}>
            Add
          </Button>
        </div>
      </fieldset>

      <section aria-labelledby="stock-heading" className="flex flex-col gap-3">
        <h2 id="stock-heading" className="font-display text-title text-ink">
          How many do you have?
        </h2>
        <p className="text-ink-soft text-sm">
          {grid.length === 1 && grid[0].size === null && grid[0].colour === null
            ? 'Type how many you have in stock. Leave it at 0 if you have none yet.'
            : `This makes ${grid.length} ${grid.length === 1 ? 'variant' : 'variants'}. Type how many you have of each. Leave 0 if you have none yet.`}
        </p>
        <ul className="flex flex-col gap-3">
          {grid.map((options) => {
            const key = variantKey(options.size, options.colour);
            return (
              <li key={key}>
                <TextField
                  label={variantLabel(options)}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={stock[key] ?? ''}
                  onChange={(event) =>
                    setStock({
                      ...stock,
                      [key]: event.target.value.replace(/\D/g, '').slice(0, 6),
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving' : 'Save product'}
      </Button>
      <p className="text-ink-soft text-sm">
        The product is saved as a draft. Photos come next, and a product needs at least one photo to
        go live.
      </p>
    </form>
  );
}
