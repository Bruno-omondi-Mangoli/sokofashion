'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { submitPaymentAction } from './submit-actions';

type PayFormProps = { reference: string; phone: string; onSent: () => void };

/* The buyer pays the shop with M-Pesa, then types the code from the M-Pesa message here */
export function PayForm({ reference, phone, onSent }: PayFormProps) {
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setProblem(null);
    startTransition(async () => {
      const response = await submitPaymentAction({
        reference,
        phone,
        code: String(data.get('code') ?? ''),
      });
      if (response.ok) {
        form.reset();
        onSent();
      } else {
        setProblem(response.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-base font-semibold">
        M-Pesa code
        <input
          name="code"
          type="text"
          required
          maxLength={30}
          placeholder="SGA4X9K2PQ"
          autoCapitalize="characters"
          autoComplete="off"
          className="bg-paper text-ink border-line min-h-12 w-full rounded-lg border px-4 text-base font-normal"
        />
      </label>
      {problem ? <Alert tone="error">{problem}</Alert> : null}
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? 'Sending...' : 'Send my M-Pesa code'}
      </Button>
    </form>
  );
}
