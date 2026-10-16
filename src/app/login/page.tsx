import Link from 'next/link';
import { signInAction } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';

type LoginPageProps = {
  searchParams: Promise<{ problem?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { problem } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Log in</h1>

      {problem === 'confirm' ? (
        <p role="alert" className="text-sm text-red-700">
          That link is invalid or has expired. If you already confirmed your email, log in below. If
          you were resetting your password, request a new link.
        </p>
      ) : null}

      <AuthForm
        action={signInAction}
        submitLabel="Log in"
        passwordAutoComplete="current-password"
      />

      <p className="text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>

      <p className="text-sm">
        New here?{' '}
        <Link href="/signup" className="underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
