'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { lookupOrderAction } from './lookup-actions';
import type { LookedUpOrder } from './lookup-schemas';
import { OrderReceipt } from './order-receipt';

const inputClass =
  'bg-paper text-ink border-line min-h-12 w-full rounded-lg border px-4 text-base font-normal';

export function OrderLookupForm({ defaultReference }: { defaultReference: string }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [found, setFound] = useState<{
    order: LookedUpOrder;
    minorUnits: number;
    whatsappPhone: string | null;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setProblem(null);
    setFound(null);
    startTransition(async () => {
      const response = await lookupOrderAction({
        reference: String(data.get('reference') ?? ''),
        phone: String(data.get('phone') ?? ''),
      });
      if (response.ok) {
        setFound({
          order: response.order,
          minorUnits: response.minorUnits,
          whatsappPhone: response.whatsappPhone,
        });
      } else {
        setProblem(response.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit}>
        <Card>
          <label className="flex flex-col gap-1 text-base font-semibold">
            Order reference
            <input
              name="reference"
              type="text"
              required
              maxLength={40}
              placeholder="SF-ABC234"
              autoCapitalize="characters"
              autoComplete="off"
              defaultValue={defaultReference}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-base font-semibold">
            Phone number you used
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              required
              placeholder="0712 345 678"
              autoComplete="tel"
              className={inputClass}
            />
          </label>
          {problem ? <Alert tone="error">{problem}</Alert> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? 'Looking...' : 'Find my order'}
          </Button>
        </Card>
      </form>

      {found ? (
        <OrderReceipt
          order={found.order}
          minorUnits={found.minorUnits}
          whatsappPhone={found.whatsappPhone}
        />
      ) : null}
    </div>
  );
}
