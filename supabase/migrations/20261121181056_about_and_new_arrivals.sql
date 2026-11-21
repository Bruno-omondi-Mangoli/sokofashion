/*
  Chunk 30b: About this shop text and new arrivals (D085, D086).
  A product counts as new for 14 days after it was created. get_public_shop and
  get_public_browse are replaced with versions that also return the text and the
  new arrivals count. Everything else about them is unchanged.
*/

alter table public.shops
  add column about text,
  add constraint shops_about_length check (about is null or char_length(about) between 1 and 500);

create or replace function public.set_shop_about(target_shop_id uuid, new_about text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean text := nullif(pg_catalog.btrim(coalesce(new_about, '')), '');
begin
  if target_shop_id is null
     or not coalesce(public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]), false) then
    raise exception 'Only the owner can change this' using errcode = '42501';
  end if;

  if clean is not null and pg_catalog.char_length(clean) > 500 then
    raise exception 'That text is too long' using errcode = '22023';
  end if;

  update public.shops s
  set about = clean
  where s.id = target_shop_id;

  return true;
end;
$function$;

revoke all on function public.set_shop_about(uuid, text) from public, anon, authenticated;
grant execute on function public.set_shop_about(uuid, text) to authenticated;

create or replace function public.get_public_shop(shop_slug text, page_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  found_shop public.shops%rowtype;
  fresh integer;
  result jsonb;
begin
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

  select pg_catalog.count(*) into fresh
  from public.products p
  where p.shop_id = found_shop.id
    and p.status = 'active'
    and p.created_at >= pg_catalog.now() - interval '14 days'
    and exists (
      select 1
      from public.product_variants v0
      where v0.product_id = p.id
        and v0.is_active
    );

  select pg_catalog.jsonb_build_object(
    'name', found_shop.name,
    'slug', found_shop.slug,
    'currency_code', found_shop.currency_code,
    'about', found_shop.about,
    'new_count', fresh,
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
        'is_new', p.created_at >= pg_catalog.now() - interval '14 days',
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

create or replace function public.get_public_browse(page_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  fresh integer;
  result jsonb;
begin
  if page_offset is null or page_offset < 0 or page_offset > 100000 then
    return null;
  end if;

  select pg_catalog.count(*) into fresh
  from public.products p
  join public.shops s on s.id = p.shop_id
  where s.status = 'active'
    and s.is_listed
    and p.status = 'active'
    and p.created_at >= pg_catalog.now() - interval '14 days'
    and exists (
      select 1
      from public.product_variants v0
      where v0.product_id = p.id
        and v0.is_active
    );

  select pg_catalog.jsonb_build_object(
    'new_count', fresh,
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
        'is_new', p.created_at >= pg_catalog.now() - interval '14 days',
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
