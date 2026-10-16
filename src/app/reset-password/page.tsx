import { redirect } from 'next/navigation';
import { updatePasswordAction } from '@/features/auth/actions';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();

  /* Only someone who just used a valid recovery link has a session here */
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login?problem=confirm');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <ResetPasswordForm action={updatePasswordAction} />
    </main>
  );
}
