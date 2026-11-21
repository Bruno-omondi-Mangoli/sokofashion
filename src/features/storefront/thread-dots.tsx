import type { PublicVariant } from './schemas';
import { uniqueColours } from './stall';

const MAX_DOTS = 4;

/* Small thread spools for the colours of a product. The names are also there for screen readers. */
export function ThreadDots({ variants }: { variants: PublicVariant[] }) {
  const colours = uniqueColours(variants);
  if (colours.length === 0) {
    return null;
  }
  const shown = colours.slice(0, MAX_DOTS);
  const extra = colours.length - shown.length;

  return (
    <div className="flex items-center gap-1">
      <ul className="flex gap-1" aria-hidden="true">
        {shown.map((colour) => (
          <li
            key={colour.label}
            className="thread-dot"
            style={{ backgroundColor: `var(--color-thread-${colour.key})` }}
          />
        ))}
      </ul>
      {extra > 0 ? <span className="text-ink-soft text-sm">+{extra}</span> : null}
      <span className="sr-only">Colours: {colours.map((colour) => colour.label).join(', ')}</span>
    </div>
  );
}
