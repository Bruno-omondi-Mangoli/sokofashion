/*
  Chunk 31: buyer order lookup (D087).
  lookup_order answers only when the reference and the phone number both match.
  Every wrong guess gives null. Failed guesses are counted per phone number.
*/

create table public.order_lookup_attempts (
  id bigint generated always as identity primary key,
  phone text not null,
  attempted_at timestamptz not null default now()
);

create index order_lookup_attempts_phone_idx on public.order_lookup_attempts (phone, attempted_at);
create index order_lookup_attempts_time_idx on public.order_lookup_attempts (attempted_at);

alter table public.order_lookup_attempts enable row level security;
revoke all on public.order_lookup_attempts from public, anon, authenticated;

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
  /* Malformed input is refused without being counted */
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

  /* Ten failed guesses for one phone in an hour lock that phone for the rest of the hour */
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
    /* Once 5000 failures are logged in an hour, stop logging so the table cannot be flooded */
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
