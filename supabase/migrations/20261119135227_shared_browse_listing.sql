/*
  Chunk 25: shared browse page with opt out (D072).
  Every active shop is listed by default. An owner can switch the listing off and on.
  get_public_browse is the only public door to the shared page (D064).
*/

alter table public.shops add column is_listed boolean not null default true;

create or replace function public.set_shop_listed(target_shop_id uuid, make_listed boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if target_shop_id is null
     or make_listed is null
     or not coalesce(public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]), false) then
    raise exception 'Only the owner can change this' using errcode = '42501';
  end if;

  update public.shops s
  set is_listed = make_listed
  where s.id = target_shop_id;

  return make_listed;
end;
$function$;

revoke all on function public.set_shop_listed(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_shop_listed(uuid, boolean) to authenticated;

create or replace function public.get_public_browse(page_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if page_offset is null or page_offset < 0 or page_offset > 100000 then
    return null;
  end if;

  select pg_catalog.jsonb_build_object(
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
        'category_code', p.category_code,
        'price_minor', p.price_minor,
        'currency_code', p.currency_code,
        'in_stock', exists (
          select 1
          from public.product_variants v
          where v.product_id = p.id
            and v.is_active
            and (
              select coalesce(pg_catalog.sum(m.quantity_change), 0)
              from public.stock_movements m
              where m.variant_id = v.id
            ) > 0
        ),
        'cover', (
          select pg_catalog.jsonb_build_object(
            'id', i.id,
            'path', i.storage_path,
            'thumb_path', pg_catalog.regexp_replace(i.storage_path, '\.(webp|jpg)$', '_t.\1'),
            'width', i.width,
            'height', i.height
          )
          from public.product_images i
          where i.product_id = p.id
          order by i.sort_order
          limit 1
        ),
        'shop', pg_catalog.jsonb_build_object('name', s.name, 'slug', s.slug)
      ) as item
    from public.products p
    join public.shops s on s.id = p.shop_id
    where s.status = 'active'
      and s.is_listed
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

revoke all on function public.get_public_browse(integer) from public, anon, authenticated;
grant execute on function public.get_public_browse(integer) to anon, authenticated;
