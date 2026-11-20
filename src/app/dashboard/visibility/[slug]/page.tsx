import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pindo } from '@/components/ui/pindo';
import { setShopListedAction } from '@/features/shops/listing-actions';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type VisibilityPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

const shopRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  is_listed: z.boolean(),
});
const roleRowSchema = z.object({ role: z.enum(['owner', 'manager', 'attendant']) });

export default async function VisibilityPage({ params, searchParams }: VisibilityPageProps) {
  const { slug } = await params;
  const { saved, problem } = await searchParams;
  if (!SHOP_LINK_PATTERN.test(slug)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
  }

  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, slug, is_listed')
    .eq('slug', slug)
    .maybeSingle();
  const shopParsed = shopRowSchema.safeParse(shopData);
  if (!shopParsed.success) {
    notFound();
  }
  const shop = shopParsed.data;

  /* Only used to decide what to show. The database refuses everybody except the owner. */
  const { data: roleData } = await supabase
    .from('shop_members')
    .select('role')
    .eq('shop_id', shop.id)
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle();
  const isOwner = roleRowSchema.safeParse(roleData).data?.role === 'owner';

  return (
    <div className="flex min-h-dvh flex-col">
      <Pindo />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/dashboard" className="text-ink-soft text-base underline underline-offset-4">
          Back to the dashboard
        </Link>
        <h1 className="font-display text-display text-ink">Shared page</h1>

        {saved ? <Alert tone="success">Saved.</Alert> : null}
        {problem ? (
          <Alert tone="error">That did not work. Only the owner can change this.</Alert>
        ) : null}

        <Card>
          <h2 className="font-display text-title text-ink">{shop.name}</h2>
          <div>
            <Badge tone={shop.is_listed ? 'positive' : 'muted'}>
              {shop.is_listed ? 'Shown on the shared page' : 'Hidden from the shared page'}
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
              <input type="hidden" name="listed" value={shop.is_listed ? 'false' : 'true'} />
              <button type="submit" className={buttonClasses('primary', 'w-full')}>
                {shop.is_listed
                  ? 'Hide my shop from the shared page'
                  : 'Show my shop on the shared page'}
              </button>
            </form>
          ) : (
            <p className="text-ink-soft text-base">Only the owner can change this.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
