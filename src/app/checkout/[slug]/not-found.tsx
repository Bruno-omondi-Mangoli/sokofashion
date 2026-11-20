import Link from 'next/link';
import { AuthShell } from '@/components/ui/auth-shell';
import { buttonClasses } from '@/components/ui/button';

export default function CheckoutNotFound() {
  return (
    <AuthShell
      title="We could not find that shop"
      intro="The link may be old or mistyped."
      saying={{
        saying: 'Pole pole ndio mwendo.',
        meaning: 'Slowly, slowly is the way.',
      }}
    >
      <Link href="/browse" className={buttonClasses('primary', 'w-full')}>
        Browse all shops
      </Link>
    </AuthShell>
  );
}
