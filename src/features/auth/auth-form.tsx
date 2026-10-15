'use client';

import { useActionState } from 'react';
import { initialAuthFormState, type AuthFormState } from './types';

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  passwordAutoComplete: 'new-password' | 'current-password';
};

export function AuthForm({ action, submitLabel, passwordAutoComplete }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-12 rounded-md border border-neutral-400 px-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          minLength={8}
          className="min-h-12 rounded-md border border-neutral-400 px-3 text-base"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.notice ? (
        <p role="status" className="text-sm text-green-800">
          {state.notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-md bg-neutral-900 px-4 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Please wait' : submitLabel}
      </button>
    </form>
  );
}
