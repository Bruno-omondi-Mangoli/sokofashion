'use client';

import { useActionState } from 'react';
import { PasswordField } from './password-field';
import { initialAuthFormState, type AuthFormState } from './types';

type ResetPasswordFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function ResetPasswordForm({ action }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PasswordField name="password" label="New password" autoComplete="new-password" />
      <PasswordField
        name="confirmPassword"
        label="Type the new password again"
        autoComplete="new-password"
      />

      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-md bg-neutral-900 px-4 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Saving' : 'Save new password'}
      </button>
    </form>
  );
}
