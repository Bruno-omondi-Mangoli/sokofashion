import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
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

export const metadata: Metadata = { title: 'Team' };

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
    <AppShell
      title={`Team for ${shop.name}`}
      userEmail={data.user.email ?? ''}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {problem ? <Alert tone="error">That did not work. Please try again.</Alert> : null}

      <section aria-labelledby="team-heading" className="flex flex-col gap-3">
        <h2 id="team-heading" className="font-display text-title text-ink">
          People with access
        </h2>
        <ul className="flex flex-col gap-3">
          {team.map((member) => (
            <li key={member.id}>
              <Card>
                <p className="text-base font-semibold break-all">{member.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={member.role}>{roleLabels[member.role]}</Badge>
                  {member.isActive ? null : <Badge tone="muted">Access removed</Badge>}
                </div>
                {member.role !== 'owner' ? (
                  <form action={setMemberActiveAction}>
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="slug" value={shop.slug} />
                    <input type="hidden" name="active" value={member.isActive ? 'false' : 'true'} />
                    <Button
                      type="submit"
                      variant={member.isActive ? 'secondary' : 'primary'}
                      className="w-full sm:w-auto"
                    >
                      {member.isActive ? 'Remove access' : 'Restore access'}
                    </Button>
                  </form>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pending-heading" className="flex flex-col gap-3">
        <h2 id="pending-heading" className="font-display text-title text-ink">
          Waiting to join
        </h2>
        {invitations.length === 0 ? (
          <p className="text-ink-soft text-base">No pending invitations.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <Card>
                  <p className="text-base font-semibold break-all">{invitation.email}</p>
                  <p className="text-ink-soft text-sm">
                    {roleLabels[invitation.role]}, expires{' '}
                    {new Date(invitation.expiresAt).toLocaleDateString('en-GB')}
                  </p>
                  <form action={cancelInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <input type="hidden" name="slug" value={shop.slug} />
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                      Cancel invitation
                    </Button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="invite-heading" className="flex flex-col gap-3">
        <h2 id="invite-heading" className="font-display text-title text-ink">
          Invite someone
        </h2>
        <p className="text-ink-soft text-base">
          After you save the invitation, ask the person to sign up at{' '}
          {publicEnv.NEXT_PUBLIC_APP_URL}/signup with exactly this email and then log in. They will
          see your invitation there.
        </p>
        <Card>
          <InviteForm action={inviteStaffAction} shopId={shop.id} slug={shop.slug} />
        </Card>
      </section>
    </AppShell>
  );
}
