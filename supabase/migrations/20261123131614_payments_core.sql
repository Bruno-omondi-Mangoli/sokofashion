/*
  Chunk 33: M-Pesa payment recording (D089).
  A buyer submits a code against an order. A team member confirms it by typing the
  amount from their M-Pesa message, and only an amount equal to the order total marks
  the order paid. A code can pay one order only, across all shops.
*/

create type public.payment_status as enum ('pending', 'confirmed', 'rejected');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  shop_id uuid not null references public.shops (id),
  mpesa_code text not null check (mpesa_code ~ '^[A-Z0-9]{10}$'),
  status public.payment_status not null default 'pending',
  amount_minor bigint check (amount_minor is null or amount_minor > 0),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid,
  foreign key (order_id, shop_id) references public.orders (id, shop_id),
  check ((status = 'confirmed') = (amount_minor is not null)),
  check ((status = 'pending') = (decided_at is null))
);

/* Pending and confirmed codes are unique everywhere. A rejected code is released. */
create unique index payments_active_code_idx on public.payments (mpesa_code)
  where status in ('pending', 'confirmed');
create index payments_order_idx on public.payments (order_id);
create index payments_shop_idx on public.payments (shop_id, submitted_at);

alter table public.payments enable row level security;

create policy "members can read their shop payments"
  on public.payments for select to authenticated
  using (public.is_shop_member(shop_id));

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

/* Unpaid orders expire as before, but an order with a recent waiting payment is kept for the seller to decide */
create or replace function public.expire_stale_orders_for_shop(target_shop_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  stale record;
begin
  for stale in
    select o.id
    from public.orders o
    where o.shop_id = target_shop_id
      and o.status = 'awaiting_payment'
      and o.expires_at <= pg_catalog.now()
      and not exists (
        select 1
        from public.payments p
        where p.order_id = o.id
          and p.status = 'pending'
          and p.submitted_at > pg_catalog.now() - interval '48 hours'
      )
    order by o.id
    for update
  loop
    update public.orders set status = 'expired' where id = stale.id;
    update public.payments
    set status = 'rejected', decided_at = pg_catalog.now()
    where order_id = stale.id and status = 'pending';
    perform public.release_order_stock(stale.id);
  end loop;
end;
$function$;

revoke all on function public.expire_stale_orders_for_shop(uuid) from public, anon, authenticated;

/* Cancelling also closes any waiting payment, and takes the shop lock first so it cannot collide with a confirmation */
create or replace function public.cancel_order(target_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  found_order public.orders%rowtype;
begin
  select * into found_order
  from public.orders o
  where o.id = target_order_id;

  if not found
     or not coalesce(public.has_shop_role(found_order.shop_id, array['owner', 'manager']::public.shop_role[]), false) then
    raise exception 'Only the owner or a manager can cancel an order' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || found_order.shop_id::text));

  select * into found_order
  from public.orders o
  where o.id = found_order.id
  for update;

  if found_order.status <> 'awaiting_payment' then
    raise exception 'Only unpaid orders can be cancelled here' using errcode = '22023';
  end if;

  update public.orders set status = 'cancelled' where id = found_order.id;
  update public.payments
  set status = 'rejected', decided_at = pg_catalog.now(), decided_by = (select auth.uid())
  where order_id = found_order.id and status = 'pending';
  perform public.release_order_stock(found_order.id);
  return true;
end;
$function$;

revoke all on function public.cancel_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;

/* The buyer lookup now also says what happened to the latest payment code */
create or replace function public.lookup_order(lookup_reference text, lookup_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean_reference text := pg_catalog.upper(pg_catalog.btrim(coalesce(lookup_reference, '')));
  clean_phone text := pg_catalog.regexp_replace(coalesce(lookup_phone, ''), '[[:space:]-]', '', 'g');
  found_order public.orders%rowtype;
  failures integer;
  recent_total integer;
  result jsonb;
begin
  if clean_reference !~ '^SF-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$' then
    return null;
  end if;

  if clean_phone ~ '^\+?254[17][0-9]{8}$' then
    clean_phone := pg_catalog.regexp_replace(clean_phone, '^\+', '');
  elsif clean_phone ~ '^0[17][0-9]{8}$' then
    clean_phone := '254' || pg_catalog.substr(clean_phone, 2);
  else
    return null;
  end if;

  select pg_catalog.count(*) into failures
  from public.order_lookup_attempts a
  where a.phone = clean_phone
    and a.attempted_at > pg_catalog.now() - interval '1 hour';

  if failures >= 10 then
    return null;
  end if;

  select * into found_order
  from public.orders o
  where o.reference = clean_reference
    and o.buyer_phone = clean_phone;

  if not found then
    select pg_catalog.count(*) into recent_total
    from public.order_lookup_attempts a
    where a.attempted_at > pg_catalog.now() - interval '1 hour';

    if recent_total < 5000 then
      delete from public.order_lookup_attempts a
      where a.attempted_at < pg_catalog.now() - interval '1 day';

      insert into public.order_lookup_attempts (phone) values (clean_phone);
    end if;
    return null;
  end if;

  select pg_catalog.jsonb_build_object(
    'reference', found_order.reference,
    'status', case
      when found_order.status = 'awaiting_payment' and found_order.expires_at <= pg_catalog.now() then 'expired'
      else found_order.status::text
    end,
    'payment_status', (
      select p.status::text
      from public.payments p
      where p.order_id = found_order.id
      order by p.submitted_at desc, p.id desc
      limit 1
    ),
    'shop', pg_catalog.jsonb_build_object('name', s.name, 'slug', s.slug),
    'delivery_method', found_order.delivery_method,
    'delivery_note', found_order.delivery_note,
    'currency_code', found_order.currency_code,
    'subtotal_minor', found_order.subtotal_minor,
    'delivery_fee_minor', found_order.delivery_fee_minor,
    'total_minor', found_order.total_minor,
    'expires_at', found_order.expires_at,
    'created_at', found_order.created_at,
    'items', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'product_name', i.product_name,
          'variant_label', i.variant_label,
          'quantity', i.quantity,
          'unit_price_minor', i.unit_price_minor
        )
        order by i.product_name, i.variant_label
      )
      from public.order_items i
      where i.order_id = found_order.id
    ), '[]'::jsonb)
  )
  into result
  from public.shops s
  where s.id = found_order.shop_id;

  return result;
end;
$function$;

revoke all on function public.lookup_order(text, text) from public, anon, authenticated;
grant execute on function public.lookup_order(text, text) to anon, authenticated;

/*
  Buyer submits an M-Pesa code. A wrong reference or phone returns null and is counted
  like a failed lookup (a raised error would roll the count back). Everything after the
  buyer proves who they are raises a coded error.
*/
create or replace function public.submit_payment(lookup_reference text, lookup_phone text, submitted_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean_reference text := pg_catalog.upper(pg_catalog.btrim(coalesce(lookup_reference, '')));
  clean_phone text := pg_catalog.regexp_replace(coalesce(lookup_phone, ''), '[[:space:]-]', '', 'g');
  clean_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(submitted_code, '')));
  found_order public.orders%rowtype;
  failures integer;
  recent_total integer;
  payment_total integer;
begin
  if clean_reference !~ '^SF-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$' or clean_code !~ '^[A-Z0-9]{10}$' then
    raise exception 'Please check the reference and the M-Pesa code' using errcode = '22023';
  end if;

  if clean_phone ~ '^\+?254[17][0-9]{8}$' then
    clean_phone := pg_catalog.regexp_replace(clean_phone, '^\+', '');
  elsif clean_phone ~ '^0[17][0-9]{8}$' then
    clean_phone := '254' || pg_catalog.substr(clean_phone, 2);
  else
    raise exception 'Please check the phone number' using errcode = '22023';
  end if;

  select pg_catalog.count(*) into failures
  from public.order_lookup_attempts a
  where a.phone = clean_phone
    and a.attempted_at > pg_catalog.now() - interval '1 hour';

  if failures >= 10 then
    return null;
  end if;

  select * into found_order
  from public.orders o
  where o.reference = clean_reference
    and o.buyer_phone = clean_phone;

  if not found then
    select pg_catalog.count(*) into recent_total
    from public.order_lookup_attempts a
    where a.attempted_at > pg_catalog.now() - interval '1 hour';

    if recent_total < 5000 then
      delete from public.order_lookup_attempts a
      where a.attempted_at < pg_catalog.now() - interval '1 day';

      insert into public.order_lookup_attempts (phone) values (clean_phone);
    end if;
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || found_order.shop_id::text));

  select * into found_order
  from public.orders o
  where o.id = found_order.id;

  if found_order.status <> 'awaiting_payment' or found_order.expires_at <= pg_catalog.now() then
    raise exception 'This order cannot take a payment' using errcode = 'SF008';
  end if;

  select pg_catalog.count(*) into payment_total
  from public.payments p
  where p.order_id = found_order.id;

  if payment_total >= 3 then
    raise exception 'Too many codes for this order' using errcode = 'SF013';
  end if;

  if exists (
    select 1 from public.payments p
    where p.order_id = found_order.id and p.status = 'pending'
  ) then
    raise exception 'A code is already waiting' using errcode = 'SF012';
  end if;

  begin
    insert into public.payments (order_id, shop_id, mpesa_code)
    values (found_order.id, found_order.shop_id, clean_code);
  exception when unique_violation then
    raise exception 'That code was already used' using errcode = 'SF011';
  end;

  return pg_catalog.jsonb_build_object('status', 'pending', 'reference', found_order.reference);
end;
$function$;

revoke all on function public.submit_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.submit_payment(text, text, text) to anon, authenticated;

/* Any team member confirms a payment by typing the amount from the M-Pesa message. Only the exact order total marks the order paid. */
create or replace function public.confirm_payment(target_payment_id uuid, received_minor bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  pay public.payments%rowtype;
  ord public.orders%rowtype;
begin
  if target_payment_id is null then
    raise exception 'You are not on this shop team' using errcode = '42501';
  end if;

  select * into pay
  from public.payments p
  where p.id = target_payment_id;

  if not found or not coalesce(public.is_shop_member(pay.shop_id), false) then
    raise exception 'You are not on this shop team' using errcode = '42501';
  end if;

  if received_minor is null or received_minor <= 0 or received_minor > 100000000000 then
    raise exception 'Please enter the amount from the M-Pesa message' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || pay.shop_id::text));

  select * into pay
  from public.payments p
  where p.id = target_payment_id
  for update;

  if pay.status <> 'pending' then
    raise exception 'That payment was already decided' using errcode = 'SF014';
  end if;

  select * into ord
  from public.orders o
  where o.id = pay.order_id
  for update;

  if ord.status <> 'awaiting_payment' then
    raise exception 'This order cannot take a payment' using errcode = 'SF008';
  end if;

  if received_minor <> ord.total_minor then
    raise exception 'The amount does not match the order total' using errcode = 'SF009';
  end if;

  update public.payments
  set status = 'confirmed',
      amount_minor = received_minor,
      decided_at = pg_catalog.now(),
      decided_by = (select auth.uid())
  where id = pay.id;

  update public.orders set status = 'paid' where id = ord.id;

  return true;
end;
$function$;

revoke all on function public.confirm_payment(uuid, bigint) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, bigint) to authenticated;

/* Any team member rejects a code that is wrong or did not arrive. The code is released for reuse. */
create or replace function public.reject_payment(target_payment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  pay public.payments%rowtype;
begin
  if target_payment_id is null then
    raise exception 'You are not on this shop team' using errcode = '42501';
  end if;

  select * into pay
  from public.payments p
  where p.id = target_payment_id;

  if not found or not coalesce(public.is_shop_member(pay.shop_id), false) then
    raise exception 'You are not on this shop team' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || pay.shop_id::text));

  select * into pay
  from public.payments p
  where p.id = target_payment_id
  for update;

  if pay.status <> 'pending' then
    raise exception 'That payment was already decided' using errcode = 'SF014';
  end if;

  update public.payments
  set status = 'rejected',
      decided_at = pg_catalog.now(),
      decided_by = (select auth.uid())
  where id = pay.id;

  return true;
end;
$function$;

revoke all on function public.reject_payment(uuid) from public, anon, authenticated;
grant execute on function public.reject_payment(uuid) to authenticated;
