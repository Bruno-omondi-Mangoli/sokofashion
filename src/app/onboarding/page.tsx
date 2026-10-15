import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/features/auth/actions';
import { createShopAction } from '@/features/shops/actions';
import { CreateShopForm } from '@/features/shops/create-shop-form';
import { getActiveCountries, getMyShops } from '@/features/shops/queries';
import { PendingInvitations } from '@/features/staff/pending-invitations';
import { getMyPendingInvitations } from '@/features/staff/queries';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

  const invitations = await getMyPendingInvitations(supabase);
  const wantsToCreateShop = mode === 'owner';

  /* The owner path: show the create shop form */
  if (wantsToCreateShop) {
    const countries = await getActiveCountries(supabase);

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
        <Link href="/onboarding" className="text-sm underline">
          Back
        </Link>
        <h1 className="text-2xl font-semibold">Set up your shop</h1>
        <p className="text-base">Tell us the basics. You can add products next.</p>
        <CreateShopForm
          action={createShopAction}
          countries={countries}
          appUrl={publicEnv.NEXT_PUBLIC_APP_URL}
        />
      </main>
    );
  }

  /* Everyone else: invitations first, then a choice */
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-base">Signed in as {data.user.email}</p>

      <PendingInvitations invitations={invitations} />

      {invitations.length === 0 ? (
        <section className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4">
          <h2 className="text-lg font-semibold">I work in a shop</h2>
          <p className="text-sm text-neutral-700">
            Ask the shop owner to invite {data.user.email} from their Team page. When they have done
            it, refresh this page and your invitation will appear here.
          </p>
          <Link
            href="/onboarding"
            className="flex min-h-12 items-center justify-center rounded-md border border-neutral-900 px-4 text-base font-medium"
          >
            Refresh
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4">
        <h2 className="text-lg font-semibold">I own a shop</h2>
        <p className="text-sm text-neutral-700">Create your shop and its link.</p>
        <Link
          href="/onboarding?mode=owner"
          className="flex min-h-12 items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-medium text-white"
        >
          Set up my shop
        </Link>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="min-h-12 w-full rounded-md border border-neutral-900 px-4 text-base font-medium"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
