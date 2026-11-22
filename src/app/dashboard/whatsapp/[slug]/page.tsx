import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { formatPhone } from '@/features/orders/format';
import { findMemberShop } from '@/features/shops/access';
import { setShopWhatsappAction } from '@/features/shops/whatsapp-actions';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'WhatsApp number' };

type WhatsappPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

const whatsappRowSchema = z.object({ whatsapp_phone: z.string().nullable() });

export default async function WhatsappPage({ params, searchParams }: WhatsappPageProps) {
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
    .select('whatsapp_phone')
    .eq('id', shop.id)
    .maybeSingle();
  const row = whatsappRowSchema.safeParse(rowData);
  if (!row.success) {
    notFound();
  }
  const current = row.data.whatsapp_phone;

  /* Only used to decide what to show. The database refuses everybody except the owner. */
  const isOwner = shop.role === 'owner';

  return (
    <AppShell
      title="WhatsApp number"
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {saved ? <Alert tone="success">Saved.</Alert> : null}
      {problem === 'format' ? (
        <Alert tone="error">Please enter a Kenyan mobile number such as 0712 345 678.</Alert>
      ) : null}
      {problem === '1' ? (
        <Alert tone="error">That did not work. Only the owner can change this.</Alert>
      ) : null}

      <Card>
        <h2 className="font-display text-title text-ink">{shop.name}</h2>
        <p className="text-ink-soft text-base">
          After a buyer places an order, they get a button that opens WhatsApp to this number with
          the order reference already typed. You then see the order in your Orders screen. This
          number is shown to buyers, so use a number you are happy to share. Leave it empty to show
          no button.
        </p>
        <p className="text-ink text-base">
          Current number: {current ? formatPhone(current) : 'none yet'}
        </p>

        {isOwner ? (
          <form action={setShopWhatsappAction} className="flex flex-col gap-4">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            <label className="flex flex-col gap-1 text-base font-semibold">
              WhatsApp number
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                maxLength={30}
                placeholder="0712 345 678"
                defaultValue={current ? formatPhone(current) : ''}
                className="bg-paper text-ink border-line min-h-12 w-full rounded-lg border px-4 text-base font-normal"
              />
            </label>
            <button type="submit" className={buttonClasses('primary', 'w-full')}>
              Save
            </button>
          </form>
        ) : (
          <p className="text-ink-soft text-base">Only the owner can change this.</p>
        )}
      </Card>
    </AppShell>
  );
}
