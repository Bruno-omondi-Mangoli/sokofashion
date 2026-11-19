/*
  Chunk 24a: public product read function (D064, D065).
  Anyone can call get_public_product. It returns one live product of one active shop,
  safe fields only. A missing product, a product of another shop, a draft, an archived
  product and a suspended shop all give the same answer: null.
*/

create or replace function public.get_public_product(shop_slug text, target_product_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  found_shop public.shops%rowtype;
  result jsonb;
begin
  if shop_slug is null
     or pg_catalog.length(shop_slug) = 0
     or pg_catalog.length(shop_slug) > 60
     or target_product_id is null then
    return null;
  end if;

  select * into found_shop
  from public.shops s
  where s.slug = shop_slug
    and s.status = 'active';

  if not found then
    return null;
  end if;

  select pg_catalog.jsonb_build_object(
    'shop', pg_catalog.jsonb_build_object('name', found_shop.name, 'slug', found_shop.slug),
    'product', pg_catalog.jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'category_code', p.category_code,
      'price_minor', p.price_minor,
      'currency_code', p.currency_code,
      'images', coalesce((
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', i.id,
            'path', i.storage_path,
            'thumb_path', pg_catalog.regexp_replace(i.storage_path, '\.(webp|jpg)$', '_t.\1'),
            'width', i.width,
            'height', i.height
          )
          order by i.sort_order
        )
        from public.product_images i
        where i.product_id = p.id
      ), '[]'::jsonb),
      'variants', coalesce((
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', v.id,
            'size', v.size,
            'colour', v.colour,
            'shade', v.shade,
            'volume_ml', v.volume_ml,
            'price_minor', coalesce(v.price_minor, p.price_minor),
            'in_stock', (
              select coalesce(pg_catalog.sum(m.quantity_change), 0)
              from public.stock_movements m
              where m.variant_id = v.id
            ) > 0
          )
          order by v.created_at, v.id
        )
        from public.product_variants v
        where v.product_id = p.id
          and v.is_active
      ), '[]'::jsonb)
    )
  )
  into result
  from public.products p
  where p.id = target_product_id
    and p.shop_id = found_shop.id
    and p.status = 'active'
    and exists (
      select 1
      from public.product_variants v2
      where v2.product_id = p.id
        and v2.is_active
    );

  return result;
end;
$function$;

revoke all on function public.get_public_product(text, uuid) from public, anon, authenticated;
grant execute on function public.get_public_product(text, uuid) to anon, authenticated;
