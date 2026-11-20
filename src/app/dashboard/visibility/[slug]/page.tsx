import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { findMemberShop } from '@/features/shops/access';
import { setShopListedAction } from '@/features/shops/listing-actions';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Shared page' };

type VisibilityPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

const listedRowSchema = z.object({ is_listed: z.boolean() });

export default async function VisibilityPage({ params, searchParams }: VisibilityPageProps) {
  const { slug } = await params;
  const { saved, problem } = await searchParams;
  if (!SHOP_LINK_PATTERN.test(slug)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect('/login');
  }

  /* Someone who is not on this shop's team gets the same not found page as for a missing shop */
  const found = await findMemberShop(supabase, slug);
  if (!found) {
    notFound();
  }
  const { shop } = found;

  const { data: listedData } = await supabase
    .from('shops')
    .select('is_listed')
    .eq('id', shop.id)
    .maybeSingle();
  const listedParsed = listedRowSchema.safeParse(listedData);
  if (!listedParsed.success) {
    notFound();
  }
  const isListed = listedParsed.data.is_listed;

  /* Only used to decide what to show. The database refuses everybody except the owner. */
  const isOwner = shop.role === 'owner';

  return (
    <AppShell
      title="Shared page"
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {saved ? <Alert tone="success">Saved.</Alert> : null}
      {problem ? (
        <Alert tone="error">That did not work. Only the owner can change this.</Alert>
      ) : null}

      <Card>
        <h2 className="font-display text-title text-ink">{shop.name}</h2>
        <div>
          <Badge tone={isListed ? 'positive' : 'muted'}>
            {isListed ? 'Shown on the shared page' : 'Hidden from the shared page'}
          </Badge>
        </div>
        <p className="text-ink-soft text-base">
          The shared page shows items from every shop in one place. Buyers tap an item and order
          from the shop that sells it. Your own shop link always keeps working, even when you hide
          your shop from the shared page.
        </p>

        {isOwner ? (
          <form action={setShopListedAction}>
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            <input type="hidden" name="listed" value={isListed ? 'false' : 'true'} />
            <button type="submit" className={buttonClasses('primary', 'w-full')}>
              {isListed ? 'Hide my shop from the shared page' : 'Show my shop on the shared page'}
            </button>
          </form>
        ) : (
          <p className="text-ink-soft text-base">Only the owner can change this.</p>
        )}

        <Link href="/browse" className={buttonClasses('secondary', 'w-full')}>
          See the shared page
        </Link>
      </Card>
    </AppShell>
  );
}
