import { useId, type TextareaHTMLAttributes } from 'react';

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  label: string;
  hint?: string;
};

export function TextAreaField({ label, hint, ...textareaProps }: TextAreaFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hint ? hintId : undefined}
        rows={4}
        className="bg-paper text-ink placeholder:text-ink-soft border-line w-full rounded-lg border-2 px-3 py-2 text-base"
        {...textareaProps}
      />
      {hint ? (
        <p id={hintId} className="text-ink-soft text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
