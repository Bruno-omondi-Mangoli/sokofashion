import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'accent';

const base =
  'inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-base font-semibold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary: 'border-primary text-primary hover:bg-sand border-2',
  accent: 'bg-marigold text-ink hover:bg-marigold-strong',
};

/*
 * Button styling as a function, so links can look like buttons too.
 * Pass only layout classes such as w-full as the extra part.
 */
export function buttonClasses(variant: ButtonVariant = 'primary', layout?: string): string {
  return cn(base, variants[variant], layout);
}

/* Styling for ordinary text links */
export const linkClasses =
  'text-primary hover:text-primary-strong font-semibold underline underline-offset-4';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

/*
 * The type defaults to "button", so a button never submits a form by accident.
 * Pass type="submit" on the buttons that should submit.
 */
export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
