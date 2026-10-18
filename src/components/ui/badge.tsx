export type BadgeTone = 'owner' | 'manager' | 'attendant' | 'muted' | 'positive' | 'negative';

const tones: Record<BadgeTone, string> = {
  owner: 'bg-marigold text-ink',
  manager: 'bg-teal text-paper',
  attendant: 'bg-primary text-on-primary',
  muted: 'bg-hairline text-ink',
  positive: 'bg-success text-paper',
  negative: 'bg-danger text-paper',
};

/* A small label such as a role or a status. Every pair is covered by the contrast tests. */
export function Badge({ tone, children }: { tone: BadgeTone; children: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
