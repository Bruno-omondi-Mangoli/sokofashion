import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/ui/auth-shell';
import { updatePasswordAction } from '@/features/auth/actions';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();

  /* Only someone who just used a valid recovery link has a session here */
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login?problem=confirm');
  }

  return (
    <AuthShell title="Choose a new password" intro="Use at least 8 characters.">
      <ResetPasswordForm action={updatePasswordAction} />
    </AuthShell>
  );
}
