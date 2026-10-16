import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/ui/auth-shell';
import { linkClasses } from '@/components/ui/button';
import { signUpAction } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      intro="Use an email you can open. We send a link to confirm it."
      saying={{
        saying: 'Haba na haba hujaza kibaba.',
        meaning: 'Little by little fills the measure.',
      }}
    >
      <AuthForm
        action={signUpAction}
        submitLabel="Create account"
        passwordAutoComplete="new-password"
      />
      <p className="text-base">
        Already have an account?{' '}
        <Link href="/login" className={linkClasses}>
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
