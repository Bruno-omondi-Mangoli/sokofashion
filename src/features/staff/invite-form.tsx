'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { initialInviteFormState, type InviteFormState } from './types';

type InviteFormProps = {
  action: (state: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  shopId: string;
  slug: string;
};

export function InviteForm({ action, shopId, slug }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialInviteFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="slug" value={slug} />

      <TextField
        label="Email of the person to invite"
        name="email"
        type="email"
        autoComplete="off"
        required
      />

      <SelectField label="Role" name="role" defaultValue="attendant">
        <option value="attendant">Attendant</option>
        <option value="manager">Manager</option>
      </SelectField>

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving' : 'Send invitation'}
      </Button>
    </form>
  );
}
