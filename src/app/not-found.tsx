import Link from 'next/link';
import { AuthShell } from '@/components/ui/auth-shell';
import { buttonClasses } from '@/components/ui/button';

export default function NotFound() {
  return (
    <AuthShell
      title="We could not find that page"
      intro="The link may be old or mistyped."
      saying={{
        saying: 'Pole pole ndio mwendo.',
        meaning: 'Slowly, slowly is the way.',
      }}
    >
      <Link href="/" className={buttonClasses('primary', 'w-full')}>
        Go to the home page
      </Link>
    </AuthShell>
  );
}
