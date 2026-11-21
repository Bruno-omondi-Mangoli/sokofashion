import { tallyGroups } from './tally';

/*
 * The market tally: a big number and tally marks drawn with CSS. It is shown only
 * when something is new. The marks are decoration, the words carry the meaning.
 */
export function NewTally({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  const groups = tallyGroups(count);

  return (
    <section
      aria-label="New arrivals"
      className="bg-paper border-hairline flex flex-wrap items-center gap-4 rounded-xl border p-4"
    >
      <p className="text-ink text-base">
        <span className="font-display text-display text-primary mr-2">{count}</span>
        new {count === 1 ? 'item' : 'items'} in the last 14 days
      </p>
      <div aria-hidden="true" className="flex flex-wrap items-center gap-3">
        {groups.map((size, groupIndex) => (
          <span key={groupIndex} className="relative inline-flex h-7 gap-1.5">
            {Array.from({ length: Math.min(size, 4) }).map((_, barIndex) => (
              <span key={barIndex} className="bg-ink h-7 w-0.5" />
            ))}
            {size === 5 ? (
              <span className="bg-hibiscus absolute top-1/2 -right-1 -left-1 h-0.5 -rotate-[25deg]" />
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}
