'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PasswordField } from './password-field';
import { initialAuthFormState, type AuthFormState } from './types';

type ResetPasswordFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function ResetPasswordForm({ action }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <PasswordField name="password" label="New password" autoComplete="new-password" />
      <PasswordField
        name="confirmPassword"
        label="Type the new password again"
        autoComplete="new-password"
      />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving' : 'Save new password'}
      </Button>
    </form>
  );
}
