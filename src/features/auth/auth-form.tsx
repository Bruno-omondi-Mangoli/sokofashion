'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { PasswordField } from './password-field';
import { initialAuthFormState, type AuthFormState } from './types';

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  passwordAutoComplete: 'new-password' | 'current-password';
};

export function AuthForm({ action, submitLabel, passwordAutoComplete }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <PasswordField name="password" label="Password" autoComplete={passwordAutoComplete} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Please wait' : submitLabel}
      </Button>
    </form>
  );
}
