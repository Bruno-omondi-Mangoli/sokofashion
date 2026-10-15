import Link from 'next/link';
import { signUpAction } from '@/features/auth/actions';
import { AuthForm } from '@/features/auth/auth-form';

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <AuthForm
        action={signUpAction}
        submitLabel="Create account"
        passwordAutoComplete="new-password"
      />
      <p className="text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
