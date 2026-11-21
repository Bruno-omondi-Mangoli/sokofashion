import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { ABOUT_MAX } from '@/features/shops/about';
import { setShopAboutAction } from '@/features/shops/about-actions';
import { findMemberShop } from '@/features/shops/access';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'About your shop' };

type AboutPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

const aboutRowSchema = z.object({ about: z.string().nullable() });

export default async function AboutPage({ params, searchParams }: AboutPageProps) {
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

  const { data: rowData } = await supabase
    .from('shops')
    .select('about')
    .eq('id', shop.id)
    .maybeSingle();
  const row = aboutRowSchema.safeParse(rowData);
  if (!row.success) {
    notFound();
  }

  /* Only used to decide what to show. The database refuses everybody except the owner. */
  const isOwner = shop.role === 'owner';

  return (
    <AppShell
      title="About your shop"
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {saved ? <Alert tone="success">Saved.</Alert> : null}
      {problem === 'long' ? (
        <Alert tone="error">
          That text is too long. Please keep it under {ABOUT_MAX} characters.
        </Alert>
      ) : null}
      {problem === '1' ? (
        <Alert tone="error">That did not work. Only the owner can change this.</Alert>
      ) : null}

      <Card>
        <h2 className="font-display text-title text-ink">{shop.name}</h2>
        <p className="text-ink-soft text-base">
          Buyers read this at the top of your shop page. Say who you are, what you sell and where
          you are. It is shown as plain text, so links and formatting do not work. Leave it empty to
          show nothing.
        </p>

        {isOwner ? (
          <form action={setShopAboutAction} className="flex flex-col gap-4">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            <label className="flex flex-col gap-1 text-base font-semibold">
              About this shop (up to {ABOUT_MAX} characters)
              <textarea
                name="about"
                rows={6}
                maxLength={ABOUT_MAX}
                defaultValue={row.data.about ?? ''}
                className="bg-paper text-ink border-line w-full rounded-lg border p-4 text-base font-normal"
              />
            </label>
            <button type="submit" className={buttonClasses('primary', 'w-full')}>
              Save
            </button>
          </form>
        ) : (
          <p className="text-ink text-base whitespace-pre-line">
            {row.data.about ?? 'No text yet. Only the owner can change this.'}
          </p>
        )}
      </Card>
    </AppShell>
  );
}
