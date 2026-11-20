/*
  Chunk 27: order core.
  Buyers have no accounts. place_order is the only way an order is created, it is
  callable by anyone, and every price, fee and stock decision is made here, never
  by the browser. Unpaid orders reserve stock and give it back when they expire
  or are cancelled.
*/

create type public.order_status as enum ('awaiting_payment', 'paid', 'completed', 'cancelled', 'expired');
create type public.delivery_method as enum ('pickup', 'delivery');
create type public.shop_delivery_mode as enum ('pickup_only', 'free_delivery', 'paid_delivery');

alter table public.shops
  add column delivery_mode public.shop_delivery_mode not null default 'pickup_only',
  add column delivery_fee_minor integer not null default 0,
  add constraint shops_delivery_fee_rules check (
    delivery_fee_minor between 0 and 100000000
    and (
      (delivery_mode = 'paid_delivery' and delivery_fee_minor > 0)
      or (delivery_mode <> 'paid_delivery' and delivery_fee_minor = 0)
    )
  );

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id),
  reference text not null unique,
  status public.order_status not null default 'awaiting_payment',
  buyer_name text not null check (char_length(buyer_name) between 2 and 80),
  buyer_phone text not null check (buyer_phone ~ '^254[17][0-9]{8}$'),
  delivery_method public.delivery_method not null,
  delivery_note text check (delivery_note is null or char_length(delivery_note) <= 300),
  currency_code text not null,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  delivery_fee_minor bigint not null check (delivery_fee_minor between 0 and 100000000),
  total_minor bigint not null check (total_minor = subtotal_minor + delivery_fee_minor),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, shop_id),
  check (delivery_method = 'delivery' or delivery_fee_minor = 0),
  check (delivery_method = 'pickup' or (delivery_note is not null and char_length(delivery_note) >= 3))
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  shop_id uuid not null references public.shops (id),
  product_id uuid not null references public.products (id),
  variant_id uuid not null references public.product_variants (id),
  product_name text not null,
  variant_label text not null,
  quantity smallint not null check (quantity between 1 and 10),
  unit_price_minor integer not null check (unit_price_minor between 0 and 100000000),
  stock_movement_id uuid references public.stock_movements (id),
  unique (order_id, variant_id),
  foreign key (order_id, shop_id) references public.orders (id, shop_id)
);

create index orders_shop_status_idx on public.orders (shop_id, status, expires_at);
create index orders_shop_phone_idx on public.orders (shop_id, buyer_phone, status);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "members can read their shop orders"
  on public.orders for select to authenticated
  using (public.is_shop_member(shop_id));

create policy "members can read their shop order items"
  on public.order_items for select to authenticated
  using (public.is_shop_member(shop_id));

revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

/* Gives the stock of an order back by writing reversal rows, never by erasing the sales (D050) */
create or replace function public.release_order_stock(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, note, reverses_id, created_at)
  select
    pg_catalog.gen_random_uuid(),
    i.shop_id,
    i.variant_id,
    -m.quantity_change,
    'reversal',
    'order released',
    m.id,
    pg_catalog.now()
  from public.order_items i
  join public.stock_movements m on m.id = i.stock_movement_id
  where i.order_id = target_order_id;
end;
$function$;

/* Unpaid orders past their time are marked expired and their stock goes back */
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
    order by o.id
    for update
  loop
    update public.orders set status = 'expired' where id = stale.id;
    perform public.release_order_stock(stale.id);
  end loop;
end;
$function$;

create or replace function public.place_order(
  target_shop_slug text,
  customer_name text,
  customer_phone text,
  delivery_choice text,
  delivery_address text,
  item_list jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  reference_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  found_shop public.shops%rowtype;
  clean_name text := pg_catalog.btrim(coalesce(customer_name, ''));
  clean_phone text := pg_catalog.regexp_replace(coalesce(customer_phone, ''), '[[:space:]-]', '', 'g');
  clean_note text := nullif(pg_catalog.btrim(coalesce(delivery_address, '')), '');
  chosen public.delivery_method;
  line_count integer;
  line record;
  valid_count integer := 0;
  on_hand bigint;
  subtotal bigint := 0;
  fee bigint := 0;
  open_for_shop integer;
  open_for_phone integer;
  new_reference text;
  new_order_id uuid;
  new_expires timestamptz;
  new_movement uuid;
  label text;
begin
  /* Input checks. Every refusal here uses 22023 and says nothing about what exists. */
  if pg_catalog.char_length(clean_name) < 2 or pg_catalog.char_length(clean_name) > 80 then
    raise exception 'Please enter your name' using errcode = '22023';
  end if;

  if clean_phone ~ '^\+?254[17][0-9]{8}$' then
    clean_phone := pg_catalog.regexp_replace(clean_phone, '^\+', '');
  elsif clean_phone ~ '^0[17][0-9]{8}$' then
    clean_phone := '254' || pg_catalog.substr(clean_phone, 2);
  else
    raise exception 'Please enter a valid Kenyan phone number' using errcode = '22023';
  end if;

  if delivery_choice = 'pickup' then
    chosen := 'pickup';
  elsif delivery_choice = 'delivery' then
    chosen := 'delivery';
  else
    raise exception 'Please choose pickup or delivery' using errcode = '22023';
  end if;

  if clean_note is not null and pg_catalog.char_length(clean_note) > 300 then
    raise exception 'That note is too long' using errcode = '22023';
  end if;
  if chosen = 'delivery' and (clean_note is null or pg_catalog.char_length(clean_note) < 3) then
    raise exception 'Please say where to deliver' using errcode = '22023';
  end if;

  if item_list is null or pg_catalog.jsonb_typeof(item_list) <> 'array' then
    raise exception 'Your cart is not valid' using errcode = '22023';
  end if;
  line_count := pg_catalog.jsonb_array_length(item_list);
  if line_count < 1 or line_count > 20 then
    raise exception 'Your cart is not valid' using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(item_list) as e(item)
    where pg_catalog.jsonb_typeof(e.item) <> 'object'
       or coalesce(e.item ->> 'variant_id', '') !~ uuid_pattern
       or (
         case
           when coalesce(e.item ->> 'quantity', '') ~ '^[0-9]{1,2}$' then (e.item ->> 'quantity')::integer
           else 0
         end
       ) not between 1 and 10
  ) then
    raise exception 'Your cart is not valid' using errcode = '22023';
  end if;

  if (
    select pg_catalog.count(distinct e.item ->> 'variant_id')
    from pg_catalog.jsonb_array_elements(item_list) as e(item)
  ) <> line_count then
    raise exception 'Your cart is not valid' using errcode = '22023';
  end if;

  /* The shop. A missing shop and a suspended shop give the same answer. */
  select * into found_shop
  from public.shops s
  where s.slug = target_shop_slug
    and s.status = 'active';

  if not found then
    raise exception 'That shop is not available' using errcode = 'SF003';
  end if;

  /* One order at a time per shop, so two buyers can never take the same last item */
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || found_shop.id::text));

  perform public.expire_stale_orders_for_shop(found_shop.id);

  select pg_catalog.count(*) into open_for_shop
  from public.orders o
  where o.shop_id = found_shop.id and o.status = 'awaiting_payment';
  if open_for_shop >= 50 then
    raise exception 'This shop cannot take new orders right now' using errcode = 'SF004';
  end if;

  select pg_catalog.count(*) into open_for_phone
  from public.orders o
  where o.shop_id = found_shop.id and o.status = 'awaiting_payment' and o.buyer_phone = clean_phone;
  if open_for_phone >= 3 then
    raise exception 'You have too many unpaid orders with this shop' using errcode = 'SF005';
  end if;

  /* First pass: lock the variants, check they may be sold, check stock, add up the price from the database */
  for line in
    select
      v.id as variant_id,
      coalesce(v.price_minor, p.price_minor) as unit_price,
      (e.item ->> 'quantity')::integer as qty
    from pg_catalog.jsonb_array_elements(item_list) as e(item)
    join public.product_variants v on v.id = (e.item ->> 'variant_id')::uuid
    join public.products p on p.id = v.product_id
    where v.shop_id = found_shop.id
      and v.is_active
      and p.status = 'active'
    order by v.id
    for update of v
  loop
    valid_count := valid_count + 1;

    select coalesce(pg_catalog.sum(m.quantity_change), 0) into on_hand
    from public.stock_movements m
    where m.variant_id = line.variant_id;

    if on_hand < line.qty then
      raise exception 'Not enough stock' using errcode = 'SF001', detail = line.variant_id::text;
    end if;

    subtotal := subtotal + line.unit_price::bigint * line.qty;
  end loop;

  if valid_count <> line_count then
    raise exception 'One of the items is not available' using errcode = 'SF002';
  end if;

  /* The delivery fee comes from the shop settings and nowhere else */
  if chosen = 'delivery' then
    if found_shop.delivery_mode = 'pickup_only' then
      raise exception 'This shop does not deliver' using errcode = 'SF006';
    end if;
    fee := found_shop.delivery_fee_minor;
  end if;

  for attempt in 1..8 loop
    new_order_id := null;
    new_reference := 'SF-' || (
      select pg_catalog.string_agg(
        pg_catalog.substr(reference_alphabet, 1 + pg_catalog.floor(pg_catalog.random() * pg_catalog.length(reference_alphabet))::integer, 1),
        ''
      )
      from pg_catalog.generate_series(1, 6)
    );
    begin
      insert into public.orders (
        shop_id, reference, buyer_name, buyer_phone, delivery_method, delivery_note,
        currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at
      )
      values (
        found_shop.id, new_reference, clean_name, clean_phone, chosen, clean_note,
        found_shop.currency_code, subtotal, fee, subtotal + fee,
        pg_catalog.now() + interval '24 hours'
      )
      returning id, expires_at into new_order_id, new_expires;
      exit;
    exception when unique_violation then
      new_order_id := null;
    end;
  end loop;

  if new_order_id is null then
    raise exception 'The order could not be created' using errcode = '55000';
  end if;

  /* Second pass: write the items and take the stock */
  for line in
    select
      v.id as variant_id,
      v.product_id,
      v.size,
      v.colour,
      v.shade,
      v.volume_ml,
      coalesce(v.price_minor, p.price_minor) as unit_price,
      p.name as product_name,
      (e.item ->> 'quantity')::integer as qty
    from pg_catalog.jsonb_array_elements(item_list) as e(item)
    join public.product_variants v on v.id = (e.item ->> 'variant_id')::uuid
    join public.products p on p.id = v.product_id
    where v.shop_id = found_shop.id
      and v.is_active
      and p.status = 'active'
    order by v.id
  loop
    new_movement := pg_catalog.gen_random_uuid();

    insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, note, created_at)
    values (new_movement, found_shop.id, line.variant_id, -line.qty, 'sale', 'order ' || new_reference, pg_catalog.now());

    label := coalesce(
      nullif(
        pg_catalog.concat_ws(
          ' / ',
          line.size,
          line.colour,
          line.shade,
          case when line.volume_ml is not null then line.volume_ml::text || ' ml' end
        ),
        ''
      ),
      'Standard'
    );

    insert into public.order_items (
      order_id, shop_id, product_id, variant_id, product_name, variant_label,
      quantity, unit_price_minor, stock_movement_id
    )
    values (
      new_order_id, found_shop.id, line.product_id, line.variant_id, line.product_name, label,
      line.qty, line.unit_price, new_movement
    );
  end loop;

  return pg_catalog.jsonb_build_object(
    'reference', new_reference,
    'status', 'awaiting_payment',
    'currency_code', found_shop.currency_code,
    'subtotal_minor', subtotal,
    'delivery_fee_minor', fee,
    'total_minor', subtotal + fee,
    'expires_at', new_expires
  );
end;
$function$;

/* Owners and managers cancel an unpaid order. Attendants cannot, so a cancelled sale cannot hide pocketed cash. */
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
  where o.id = target_order_id
  for update;

  if not found
     or not coalesce(public.has_shop_role(found_order.shop_id, array['owner', 'manager']::public.shop_role[]), false) then
    raise exception 'Only the owner or a manager can cancel an order' using errcode = '42501';
  end if;

  if found_order.status <> 'awaiting_payment' then
    raise exception 'Only unpaid orders can be cancelled here' using errcode = '22023';
  end if;

  update public.orders set status = 'cancelled' where id = found_order.id;
  perform public.release_order_stock(found_order.id);
  return true;
end;
$function$;

/* Only the owner sets how the shop delivers, because it changes what buyers pay */
create or replace function public.set_shop_delivery(
  target_shop_id uuid,
  new_mode public.shop_delivery_mode,
  new_fee_minor integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if target_shop_id is null
     or not coalesce(public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]), false) then
    raise exception 'Only the owner can change this' using errcode = '42501';
  end if;

  if new_mode is null
     or new_fee_minor is null
     or new_fee_minor < 0
     or new_fee_minor > 100000000
     or (new_mode = 'paid_delivery' and new_fee_minor = 0)
     or (new_mode <> 'paid_delivery' and new_fee_minor <> 0) then
    raise exception 'That delivery setting is not valid' using errcode = '22023';
  end if;

  update public.shops s
  set delivery_mode = new_mode, delivery_fee_minor = new_fee_minor
  where s.id = target_shop_id;

  return true;
end;
$function$;

revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.expire_stale_orders_for_shop(uuid) from public, anon, authenticated;

revoke all on function public.place_order(text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(text, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.cancel_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;

revoke all on function public.set_shop_delivery(uuid, public.shop_delivery_mode, integer) from public, anon, authenticated;
grant execute on function public.set_shop_delivery(uuid, public.shop_delivery_mode, integer) to authenticated;
