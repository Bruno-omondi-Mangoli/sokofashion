import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/* Shared look of every text box, so the password box matches the others */
export function fieldInputClasses(hasError: boolean): string {
  return cn(
    'bg-paper text-ink placeholder:text-ink-soft min-h-12 w-full rounded-lg border-2 px-3 text-base',
    hasError ? 'border-danger' : 'border-line',
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ label, hint, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={fieldInputClasses(Boolean(error))}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-ink-soft text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
