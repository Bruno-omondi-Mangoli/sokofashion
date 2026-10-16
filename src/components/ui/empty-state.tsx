import type { ReactNode } from 'react';
import { Ujumbe, type UjumbeText } from './ujumbe';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  saying?: UjumbeText;
};

/* An empty screen is an invitation. It says what is missing and what to do next. */
export function EmptyState({ title, description, action, saying }: EmptyStateProps) {
  return (
    <section className="kanga-frame bg-paper flex flex-col gap-4 p-8">
      <h2 className="font-display text-title text-ink">{title}</h2>
      <p className="text-ink-soft text-base">{description}</p>
      {action}
      {saying ? <Ujumbe saying={saying.saying} meaning={saying.meaning} /> : null}
    </section>
  );
}
