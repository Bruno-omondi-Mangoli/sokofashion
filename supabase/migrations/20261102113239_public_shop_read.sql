/* Public read function for the storefront (D064, D065).
   Anyone, including signed out buyers, may call it.
   It returns only safe fields of live products of one active shop. */

create or replace function public.get_public_shop(shop_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'name', s.name,
    'slug', s.slug,
    'currency_code', s.currency_code,
    'language', s.language,
    'products', coalesce((
      select jsonb_agg(item.body order by item.created_at desc)
      from (
        select
          p.created_at,
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'category_code', p.category_code,
            'price_minor', p.price_minor,
            'currency_code', p.currency_code,
            'photos', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'path', i.storage_path,
                  'thumb_path', regexp_replace(i.storage_path, '\.(webp|jpg)$', '_t.\1'),
                  'width', i.width,
                  'height', i.height
                )
                order by i.sort_order
              )
              from public.product_images i
              where i.product_id = p.id
            ), '[]'::jsonb),
            'variants', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', v.id,
                  'size', v.size,
                  'colour', v.colour,
                  'shade', v.shade,
                  'volume_ml', v.volume_ml,
                  'price_minor', coalesce(v.price_minor, p.price_minor),
                  'in_stock', (
                    coalesce((
                      select sum(m.quantity_change)
                      from public.stock_movements m
                      where m.variant_id = v.id
                    ), 0) > 0
                    and (v.expires_on is null or v.expires_on >= current_date)
                  )
                )
                order by v.created_at, v.id
              )
              from public.product_variants v
              where v.product_id = p.id
                and v.is_active
            ), '[]'::jsonb)
          ) as body
        from public.products p
        where p.shop_id = s.id
          and p.status = 'active'
        order by p.created_at desc
        limit 100
      ) item
    ), '[]'::jsonb)
  )
  from public.shops s
  where s.slug = lower(shop_slug)
    and s.status = 'active';
$function$;

revoke all on function public.get_public_shop(text) from public, anon, authenticated;
grant execute on function public.get_public_shop(text) to anon, authenticated;
