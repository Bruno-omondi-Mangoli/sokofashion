import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyShops } from '@/features/shops/queries';
import {
  cancelInvitationAction,
  inviteStaffAction,
  setMemberActiveAction,
} from '@/features/staff/actions';
import { InviteForm } from '@/features/staff/invite-form';
import { getShopInvitations, getTeam } from '@/features/staff/queries';
import { roleLabels } from '@/features/staff/types';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type TeamPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ problem?: string }>;
};

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { slug } = await params;
  const { problem } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }

  /* Only the owner of this shop may manage its team. The database enforces it too. */
  const shops = await getMyShops(supabase, data.user.id);
  const shop = shops.find((candidate) => candidate.slug === slug && candidate.role === 'owner');
  if (!shop) {
    redirect('/dashboard');
  }

  const [team, invitations] = await Promise.all([
    getTeam(supabase, shop.id),
    getShopInvitations(supabase, shop.id),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold">Team for {shop.name}</h1>
      </div>

      {problem ? (
        <p role="alert" className="text-sm text-red-700">
          That did not work. Please try again.
        </p>
      ) : null}

      <section aria-labelledby="team-heading" className="flex flex-col gap-3">
        <h2 id="team-heading" className="text-lg font-semibold">
          People with access
        </h2>
        <ul className="flex flex-col gap-3">
          {team.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4"
            >
              <p className="text-base font-medium">{member.email}</p>
              <p className="text-sm text-neutral-700">
                {roleLabels[member.role]}, {member.isActive ? 'active' : 'access removed'}
              </p>
              {member.role !== 'owner' ? (
                <form action={setMemberActiveAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <input type="hidden" name="slug" value={shop.slug} />
                  <input type="hidden" name="active" value={member.isActive ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className="min-h-12 rounded-md border border-neutral-900 px-4 text-base font-medium"
                  >
                    {member.isActive ? 'Remove access' : 'Restore access'}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pending-heading" className="flex flex-col gap-3">
        <h2 id="pending-heading" className="text-lg font-semibold">
          Waiting to join
        </h2>
        {invitations.length === 0 ? (
          <p className="text-sm text-neutral-700">No pending invitations.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4"
              >
                <p className="text-base font-medium">{invitation.email}</p>
                <p className="text-sm text-neutral-700">
                  {roleLabels[invitation.role]}, expires{' '}
                  {new Date(invitation.expiresAt).toLocaleDateString('en-GB')}
                </p>
                <form action={cancelInvitationAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <input type="hidden" name="slug" value={shop.slug} />
                  <button
                    type="submit"
                    className="min-h-12 rounded-md border border-neutral-900 px-4 text-base font-medium"
                  >
                    Cancel invitation
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="invite-heading" className="flex flex-col gap-3">
        <h2 id="invite-heading" className="text-lg font-semibold">
          Invite someone
        </h2>
        <p className="text-sm text-neutral-700">
          After you save the invitation, ask the person to sign up at{' '}
          {publicEnv.NEXT_PUBLIC_APP_URL}
          /signup with exactly this email and then log in. They will see your invitation there.
        </p>
        <InviteForm action={inviteStaffAction} shopId={shop.id} slug={shop.slug} />
      </section>
    </main>
  );
}
