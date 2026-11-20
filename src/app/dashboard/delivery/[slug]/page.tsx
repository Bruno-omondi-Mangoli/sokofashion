import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { AppShell } from '@/components/ui/app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOutAction } from '@/features/auth/actions';
import { formatMoney } from '@/features/catalogue/money';
import { modeLabels } from '@/features/orders/fee';
import { findMemberShop } from '@/features/shops/access';
import { setShopDeliveryAction } from '@/features/shops/delivery-actions';
import { getCurrencyMinorUnits } from '@/features/storefront/queries';
import { SHOP_LINK_PATTERN } from '@/features/storefront/view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Delivery' };

type DeliveryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; problem?: string }>;
};

const deliveryRowSchema = z.object({
  currency_code: z.string(),
  delivery_mode: z.enum(['pickup_only', 'free_delivery', 'paid_delivery']),
  delivery_fee_minor: z.number().int().nonnegative(),
});

export default async function DeliveryPage({ params, searchParams }: DeliveryPageProps) {
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
    .select('currency_code, delivery_mode, delivery_fee_minor')
    .eq('id', shop.id)
    .maybeSingle();
  const row = deliveryRowSchema.safeParse(rowData);
  if (!row.success) {
    notFound();
  }
  const setting = row.data;
  const units = await getCurrencyMinorUnits(setting.currency_code);

  /* Only used to decide what to show. The database refuses everybody except the owner. */
  const isOwner = shop.role === 'owner';

  const options = [
    { value: 'pickup_only', label: 'Pickup only. Buyers collect their orders.' },
    { value: 'free_delivery', label: 'Free delivery. Buyers pay nothing extra.' },
    {
      value: 'paid_delivery',
      label: 'Paid delivery. Buyers pay the fee below when they choose delivery.',
    },
  ] as const;

  return (
    <AppShell
      title="Delivery"
      userEmail={found.user.email}
      signOut={signOutAction}
      backHref="/dashboard"
      backLabel="Back to your shops"
    >
      {saved ? <Alert tone="success">Saved.</Alert> : null}
      {problem === 'fee' ? (
        <Alert tone="error">Please enter a delivery fee above zero, such as 300.</Alert>
      ) : null}
      {problem === '1' ? (
        <Alert tone="error">That did not work. Only the owner can change this.</Alert>
      ) : null}

      <Card>
        <h2 className="font-display text-title text-ink">{shop.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">{modeLabels[setting.delivery_mode]}</Badge>
          {setting.delivery_mode === 'paid_delivery' ? (
            <span className="text-ink text-base font-semibold">
              {formatMoney(setting.delivery_fee_minor, setting.currency_code, units)}
            </span>
          ) : null}
        </div>
        <p className="text-ink-soft text-base">
          Buyers see this when they place an order. The fee is added to their total only when they
          choose delivery. Pickup always costs nothing.
        </p>

        {isOwner ? (
          <form action={setShopDeliveryAction} className="flex flex-col gap-4">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            <fieldset className="flex flex-col gap-2">
              <legend className="text-ink text-base font-semibold">How do you deliver?</legend>
              {options.map((option) => (
                <label key={option.value} className="flex min-h-12 items-start gap-3 text-base">
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    defaultChecked={setting.delivery_mode === option.value}
                    className="mt-1"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1 text-base font-semibold">
              Delivery fee (only for paid delivery)
              <input
                name="fee"
                type="text"
                inputMode="decimal"
                placeholder="300"
                defaultValue={
                  setting.delivery_fee_minor > 0
                    ? String(setting.delivery_fee_minor / 10 ** units)
                    : ''
                }
                className="bg-paper text-ink border-hairline min-h-12 w-full rounded-lg border px-4 text-base"
              />
            </label>
            <button type="submit" className={buttonClasses('primary', 'w-full')}>
              Save delivery setting
            </button>
          </form>
        ) : (
          <p className="text-ink-soft text-base">Only the owner can change this.</p>
        )}
      </Card>
    </AppShell>
  );
}
