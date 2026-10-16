import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { AuthShell } from '@/components/ui/auth-shell';
import { linkClasses } from '@/components/ui/button';
import { signInAction } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata: Metadata = { title: 'Log in' };

type LoginPageProps = {
  searchParams: Promise<{ problem?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { problem } = await searchParams;

  return (
    <AuthShell title="Log in" saying={{ saying: 'Karibu tena.', meaning: 'Welcome back.' }}>
      {problem === 'confirm' ? (
        <Alert tone="error">
          That link is invalid or has expired. If you already confirmed your email, log in below. If
          you were resetting your password, request a new link.
        </Alert>
      ) : null}

      <AuthForm
        action={signInAction}
        submitLabel="Log in"
        passwordAutoComplete="current-password"
      />

      <div className="flex flex-col gap-1 text-base">
        <Link
          href="/forgot-password"
          className={`${linkClasses} inline-flex min-h-11 items-center`}
        >
          Forgot password?
        </Link>
        <p>
          New here?{' '}
          <Link href="/signup" className={linkClasses}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
