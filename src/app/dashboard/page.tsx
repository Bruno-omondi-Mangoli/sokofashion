import { redirect } from 'next/navigation';
import { signOutAction } from '@/features/auth/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  /*
   * getUser asks the Supabase server to confirm the session, so a forged or
   * revoked cookie is rejected. Always use it for access decisions.
   */
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-base">Signed in as {data.user.email}</p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="min-h-12 rounded-md border border-neutral-900 px-4 text-base font-medium"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
