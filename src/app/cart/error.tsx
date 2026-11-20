'use client';

import { AuthShell } from '@/components/ui/auth-shell';
import { buttonClasses } from '@/components/ui/button';

export default function CartError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AuthShell
      title="Something went wrong"
      intro="We could not show your cart. Please try again."
      saying={{
        saying: 'Haba na haba hujaza kibaba.',
        meaning: 'Little by little fills the measure.',
      }}
    >
      <button type="button" onClick={reset} className={buttonClasses('primary', 'w-full')}>
        Try again
      </button>
    </AuthShell>
  );
}
