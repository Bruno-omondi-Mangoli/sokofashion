import { redirect } from 'next/navigation';
import { createShopAction } from '@/features/shops/actions';
import { CreateShopForm } from '@/features/shops/create-shop-form';
import { getActiveCountries, getMyShops } from '@/features/shops/queries';
import { PendingInvitations } from '@/features/staff/pending-invitations';
import { getMyPendingInvitations } from '@/features/staff/queries';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
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

  const [countries, invitations] = await Promise.all([
    getActiveCountries(supabase),
    getMyPendingInvitations(supabase),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <PendingInvitations invitations={invitations} />
      <h1 className="text-2xl font-semibold">
        {invitations.length > 0 ? 'Or set up your own shop' : 'Set up your shop'}
      </h1>
      <p className="text-base">Tell us the basics. You can add products next.</p>
      <CreateShopForm
        action={createShopAction}
        countries={countries}
        appUrl={publicEnv.NEXT_PUBLIC_APP_URL}
      />
    </main>
  );
}
