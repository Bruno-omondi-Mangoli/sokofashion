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

/* Every button on a shop card, with a sentence that says what it does */
function shopActions(slug: string) {
  return [
    {
      href: `/dashboard/products/${slug}`,
      label: 'Products',
      text: 'Add and change what you sell, with photos and stock.',
      variant: 'primary' as const,
      ownerOnly: false,
    },
    {
      href: `/dashboard/orders/${slug}`,
      label: 'Orders',
      text: 'See who ordered and contact the buyer.',
      variant: 'secondary' as const,
      ownerOnly: false,
    },
    {
      href: `/s/${slug}`,
      label: 'View shop',
      text: 'See your shop the way buyers see it.',
      variant: 'secondary' as const,
      ownerOnly: false,
    },
    {
      href: `/dashboard/team/${slug}`,
      label: 'Manage team',
      text: 'Invite staff and switch off their access.',
      variant: 'secondary' as const,
      ownerOnly: true,
    },
    {
      href: `/dashboard/visibility/${slug}`,
      label: 'Shared page',
      text: 'Choose whether your items show on the page shared with other shops.',
      variant: 'secondary' as const,
      ownerOnly: true,
    },
    {
      href: `/dashboard/delivery/${slug}`,
      label: 'Delivery',
      text: 'Set pickup only, free delivery or a delivery fee.',
      variant: 'secondary' as const,
      ownerOnly: true,
    },
    {
      href: `/dashboard/about/${slug}`,
      label: 'About',
      text: 'Write a short text about your shop that buyers read at the top of your page.',
      variant: 'secondary' as const,
      ownerOnly: true,
    },
  ];
}

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
              <ul className="flex flex-col gap-3">
                {shopActions(shop.slug)
                  .filter((action) => !action.ownerOnly || shop.role === 'owner')
                  .map((action) => (
                    <li
                      key={action.href}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <Link
                        href={action.href}
                        className={buttonClasses(action.variant, 'w-full sm:w-40 sm:shrink-0')}
                      >
                        {action.label}
                      </Link>
                      <p className="text-ink-soft text-sm">{action.text}</p>
                    </li>
                  ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
