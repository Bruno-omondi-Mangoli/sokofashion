import Link from 'next/link';
import { signInAction } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <AuthForm
        action={signInAction}
        submitLabel="Log in"
        passwordAutoComplete="current-password"
      />
      <p className="text-sm">
        New here?{' '}
        <Link href="/signup" className="underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
