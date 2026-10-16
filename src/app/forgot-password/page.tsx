import Link from 'next/link';
import { requestPasswordResetAction } from '@/features/auth/actions';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Forgot your password?</h1>
      <p className="text-base">
        Enter your email and we will send you a link to choose a new password.
      </p>
      <ForgotPasswordForm action={requestPasswordResetAction} />
      <Link href="/login" className="text-sm underline">
        Back to log in
      </Link>
    </main>
  );
}
