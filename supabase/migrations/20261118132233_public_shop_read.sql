/*
  Chunk 23b: public storefront read function (D064, D065).
  Anyone can call get_public_shop. It returns one active shop with its live products
  as JSON, safe fields only. Nobody can read the tables directly.
  A missing shop and a suspended shop give the same answer: null.
*/

create or replace function public.get_public_shop(shop_slug text, page_offset integer default 0)
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
  /* Reject nonsense input early. These checks keep every call cheap. */
  if shop_slug is null
     or pg_catalog.length(shop_slug) = 0
     or pg_catalog.length(shop_slug) > 60
     or page_offset is null
     or page_offset < 0
     or page_offset > 100000 then
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
    'name', found_shop.name,
    'slug', found_shop.slug,
    'currency_code', found_shop.currency_code,
    'products', coalesce(
      pg_catalog.jsonb_agg(pj.item order by pj.created_at desc, pj.id),
      '[]'::jsonb
    )
  )
  into result
  from (
    select
      p.id,
      p.created_at,
      pg_catalog.jsonb_build_object(
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
      ) as item
    from public.products p
    where p.shop_id = found_shop.id
      and p.status = 'active'
      and exists (
        select 1
        from public.product_variants v2
        where v2.product_id = p.id
          and v2.is_active
      )
    order by p.created_at desc, p.id
    limit 48
    offset page_offset
  ) pj;

  return result;
end;
$function$;

revoke all on function public.get_public_shop(text, integer) from public, anon, authenticated;
grant execute on function public.get_public_shop(text, integer) to anon, authenticated;

/* The trigger helper does not need to be callable by anyone. Triggers check permission when created, not when they fire. */
revoke all on function public.set_updated_at() from public, anon, authenticated;

/* The countries list is read only for everybody. Remove every other permission, including TRUNCATE, which ignores RLS. */
revoke insert, update, delete, truncate, references, trigger on public.countries from anon, authenticated;
