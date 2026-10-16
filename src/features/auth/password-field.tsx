'use client';

import { useId, useState } from 'react';
import { fieldInputClasses } from '@/components/ui/text-field';

type PasswordFieldProps = {
  name: string;
  label: string;
  autoComplete: 'new-password' | 'current-password';
};

/*
 * A password box with a Show and Hide button. The button is type "button" so
 * pressing it never submits the form.
 */
export function PasswordField({ name, label, autoComplete }: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-ink text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          maxLength={72}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${fieldInputClasses(false)} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="border-primary text-primary hover:bg-sand min-h-12 min-w-20 rounded-lg border-2 px-3 text-sm font-semibold"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
