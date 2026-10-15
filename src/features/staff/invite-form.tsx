'use client';

import { useActionState } from 'react';
import { initialInviteFormState, type InviteFormState } from './types';

type InviteFormProps = {
  action: (state: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  shopId: string;
  slug: string;
};

export function InviteForm({ action, shopId, slug }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialInviteFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="slug" value={slug} />

      <label className="flex flex-col gap-1 text-sm font-medium">
        Email of the person to invite
        <input
          name="email"
          type="email"
          autoComplete="off"
          required
          className="min-h-12 rounded-md border border-neutral-400 px-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Role
        <select
          name="role"
          defaultValue="attendant"
          className="min-h-12 rounded-md border border-neutral-400 bg-white px-3 text-base"
        >
          <option value="attendant">Attendant</option>
          <option value="manager">Manager</option>
        </select>
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
        {pending ? 'Saving' : 'Send invitation'}
      </button>
    </form>
  );
}
