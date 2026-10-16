import type { ReactNode } from 'react';

export type AlertTone = 'error' | 'success' | 'info';

const tones: Record<AlertTone, string> = {
  error: 'border-danger bg-danger-wash text-danger',
  success: 'border-success bg-success-wash text-success',
  info: 'border-primary bg-paper text-ink',
};

/* Errors interrupt a screen reader, other messages wait politely */
export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border-l-4 px-4 py-3 text-base ${tones[tone]}`}
    >
      {children}
    </p>
  );
}
