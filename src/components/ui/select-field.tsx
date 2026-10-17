import { useId, type SelectHTMLAttributes } from 'react';
import { fieldInputClasses } from './text-field';

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
  label: string;
};

export function SelectField({ label, children, ...selectProps }: SelectFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
      </label>
      <select id={id} className={fieldInputClasses(false)} {...selectProps}>
        {children}
      </select>
    </div>
  );
}
