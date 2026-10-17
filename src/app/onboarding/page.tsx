import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/ui/auth-shell';
import { Button, buttonClasses, linkClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { createShopAction } from '@/features/shops/actions';
import { CreateShopForm } from '@/features/shops/create-shop-form';
import { getActiveCountries, getMyShops } from '@/features/shops/queries';
import { PendingInvitations } from '@/features/staff/pending-invitations';
import { getMyPendingInvitations } from '@/features/staff/queries';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Welcome' };

type OnboardingPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { mode } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }

  /* People who already have a shop have nothing to set up here */
  const shops = await getMyShops(supabase, data.user.id);
  if (shops.length > 0) {
    redirect('/dashboard');
  }

  /* The owner path: show the create shop form */
  if (mode === 'owner') {
    const countries = await getActiveCountries(supabase);

    return (
      <AuthShell title="Set up your shop" intro="Tell us the basics. You can add products next.">
        <CreateShopForm
          action={createShopAction}
          countries={countries}
          appUrl={publicEnv.NEXT_PUBLIC_APP_URL}
        />
        <Link href="/onboarding" className={`${linkClasses} inline-flex min-h-11 items-center`}>
          Back
        </Link>
      </AuthShell>
    );
  }

  /* Everyone else: invitations first, then a choice */
  const invitations = await getMyPendingInvitations(supabase);

  return (
    <AuthShell
      title="Welcome"
      intro={`Signed in as ${data.user.email ?? ''}`}
      saying={{ saying: 'Karibu.', meaning: 'Welcome.' }}
    >
      <PendingInvitations invitations={invitations} />

      {invitations.length === 0 ? (
        <Card>
          <h2 className="font-display text-title text-ink">I work in a shop</h2>
          <p className="text-ink-soft text-base">
            Ask the shop owner to invite {data.user.email} from their Team page. When they have done
            it, refresh this page and your invitation will appear here.
          </p>
          <Link href="/onboarding" className={buttonClasses('secondary', 'w-full')}>
            Refresh
          </Link>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-display text-title text-ink">I own a shop</h2>
        <p className="text-ink-soft text-base">Create your shop and its link.</p>
        <Link href="/onboarding?mode=owner" className={buttonClasses('primary', 'w-full')}>
          Set up my shop
        </Link>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>
    </AuthShell>
  );
}
