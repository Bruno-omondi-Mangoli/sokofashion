import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { getMyShops } from '@/features/shops/queries';
import { PendingInvitations } from '@/features/staff/pending-invitations';
import { getMyPendingInvitations } from '@/features/staff/queries';
import { roleLabels } from '@/features/staff/types';
import { publicEnv } from '@/lib/env/public';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Your shops' };

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
    <AppShell title="Your shops" userEmail={data.user.email ?? ''} signOut={signOutAction}>
      {problem === 'invite' ? (
        <Alert tone="error">
          That invitation could not be accepted. Ask the owner to send it again.
        </Alert>
      ) : null}

      <PendingInvitations invitations={invitations} />

      <ul className="flex flex-col gap-4">
        {shops.map((shop) => (
          <li key={shop.id}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-title text-ink">{shop.name}</h2>
                <Badge tone={shop.role}>{roleLabels[shop.role]}</Badge>
              </div>
              <p className="text-ink-soft text-sm break-all">
                Shop link: {publicEnv.NEXT_PUBLIC_APP_URL}/s/{shop.slug}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/dashboard/products/${shop.slug}`}
                  className={buttonClasses('primary', 'w-full sm:w-auto')}
                >
                  Products
                </Link>
                <Link
                  href={`/s/${shop.slug}`}
                  className={buttonClasses('secondary', 'w-full sm:w-auto')}
                >
                  View shop
                </Link>
                <Link
                  href={`/dashboard/orders/${shop.slug}`}
                  className={buttonClasses('secondary', 'w-full sm:w-auto')}
                >
                  Orders
                </Link>
                {shop.role === 'owner' ? (
                  <>
                    <Link
                      href={`/dashboard/team/${shop.slug}`}
                      className={buttonClasses('secondary', 'w-full sm:w-auto')}
                    >
                      Manage team
                    </Link>
                    <Link
                      href={`/dashboard/visibility/${shop.slug}`}
                      className={buttonClasses('secondary', 'w-full sm:w-auto')}
                    >
                      Shared page
                    </Link>
                    <Link
                      href={`/dashboard/delivery/${shop.slug}`}
                      className={buttonClasses('secondary', 'w-full sm:w-auto')}
                    >
                      Delivery
                    </Link>
                  </>
                ) : null}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
