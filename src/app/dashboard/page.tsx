import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/features/auth/actions';
import { getMyShops } from '@/features/shops/queries';
import { PendingInvitations } from '@/features/staff/pending-invitations';
import { getMyPendingInvitations } from '@/features/staff/queries';
import { roleLabels } from '@/features/staff/types';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type DashboardPageProps = {
  searchParams: Promise<{ problem?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { problem } = await searchParams;
  const supabase = await createSupabaseServerClient();

  /*
   * getUser asks the Supabase server to confirm the session, so a forged or
   * revoked cookie is rejected. Always use it for access decisions.
   */
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/login');
  }

  const shops = await getMyShops(supabase, data.user.id);

  if (shops.length === 0) {
    redirect('/onboarding');
  }

  const invitations = await getMyPendingInvitations(supabase);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-base">Signed in as {data.user.email}</p>

      {problem === 'invite' ? (
        <p role="alert" className="text-sm text-red-700">
          That invitation could not be accepted. Ask the owner to send it again.
        </p>
      ) : null}

      <PendingInvitations invitations={invitations} />

      <ul className="flex flex-col gap-4">
        {shops.map((shop) => (
          <li
            key={shop.id}
            className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4"
          >
            <p className="text-lg font-medium">{shop.name}</p>
            <p className="text-sm text-neutral-700">Your role: {roleLabels[shop.role]}</p>
            <p className="text-sm text-neutral-700">
              Your shop link: {publicEnv.NEXT_PUBLIC_APP_URL}/{shop.slug}
            </p>
            <p className="text-sm text-neutral-700">The public storefront is coming soon.</p>
            {shop.role === 'owner' ? (
              <Link href={`/dashboard/team/${shop.slug}`} className="text-base underline">
                Manage team
              </Link>
            ) : null}
          </li>
        ))}
      </ul>

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
