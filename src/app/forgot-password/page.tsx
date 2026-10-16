import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/ui/auth-shell';
import { linkClasses } from '@/components/ui/button';
import { requestPasswordResetAction } from '@/features/auth/actions';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export const metadata: Metadata = { title: 'Forgot your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      intro="Enter your email and we will send you a link to choose a new password."
      saying={{
        saying: 'Pole pole ndio mwendo.',
        meaning: 'Slowly, slowly is the way. Take your time.',
      }}
    >
      <ForgotPasswordForm action={requestPasswordResetAction} />
      <Link href="/login" className={`${linkClasses} inline-flex min-h-11 items-center`}>
        Back to log in
      </Link>
    </AuthShell>
  );
}
