/*
  Chunk 28: public checkout info (D064, D082).
  Anyone can call get_public_checkout_info. It returns the few facts a buyer needs
  before ordering. A missing shop and a suspended shop both give null.
*/

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
    'delivery_fee_minor', found_shop.delivery_fee_minor
  );
end;
$function$;

revoke all on function public.get_public_checkout_info(text) from public, anon, authenticated;
grant execute on function public.get_public_checkout_info(text) to anon, authenticated;
