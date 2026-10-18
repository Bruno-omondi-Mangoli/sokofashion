import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ChipProps = {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/* A choice that can be switched on and off, such as a size or a colour */
export function Chip({ selected, onToggle, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'min-h-11 min-w-11 rounded-full border-2 px-4 text-base font-semibold transition-colors',
        selected ? 'border-primary bg-primary text-on-primary' : 'border-line bg-paper text-ink',
      )}
    >
      {children}
    </button>
  );
}
