/*
  Chunk 32: shop WhatsApp number (D088).
  Only the owner sets it. It is stored as 254 plus nine digits, and it is returned by
  get_public_checkout_info so buyers can message the shop about an order.
*/

alter table public.shops
  add column whatsapp_phone text,
  add constraint shops_whatsapp_phone_format check (whatsapp_phone is null or whatsapp_phone ~ '^254[17][0-9]{8}$');

create or replace function public.set_shop_whatsapp(target_shop_id uuid, new_phone text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  cleaned text := pg_catalog.regexp_replace(coalesce(new_phone, ''), '[[:space:]-]', '', 'g');
  final_phone text;
begin
  if target_shop_id is null
     or not coalesce(public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]), false) then
    raise exception 'Only the owner can change this' using errcode = '42501';
  end if;

  if cleaned = '' then
    final_phone := null;
  elsif cleaned ~ '^\+?254[17][0-9]{8}$' then
    final_phone := pg_catalog.regexp_replace(cleaned, '^\+', '');
  elsif cleaned ~ '^0[17][0-9]{8}$' then
    final_phone := '254' || pg_catalog.substr(cleaned, 2);
  else
    raise exception 'Please enter a valid Kenyan mobile number' using errcode = '22023';
  end if;

  update public.shops s
  set whatsapp_phone = final_phone
  where s.id = target_shop_id;

  return true;
end;
$function$;

revoke all on function public.set_shop_whatsapp(uuid, text) from public, anon, authenticated;
grant execute on function public.set_shop_whatsapp(uuid, text) to authenticated;

create or replace function public.get_public_checkout_info(shop_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  found_shop public.shops%rowtype;
begin
  if shop_slug is null
     or pg_catalog.length(shop_slug) = 0
     or pg_catalog.length(shop_slug) > 60 then
    return null;
  end if;

  select * into found_shop
  from public.shops s
  where s.slug = shop_slug
    and s.status = 'active';

  if not found then
    return null;
  end if;

  return pg_catalog.jsonb_build_object(
    'name', found_shop.name,
    'slug', found_shop.slug,
    'currency_code', found_shop.currency_code,
    'delivery_mode', found_shop.delivery_mode,
    'delivery_fee_minor', found_shop.delivery_fee_minor,
    'whatsapp_phone', found_shop.whatsapp_phone
  );
end;
$function$;

revoke all on function public.get_public_checkout_info(text) from public, anon, authenticated;
grant execute on function public.get_public_checkout_info(text) to anon, authenticated;
