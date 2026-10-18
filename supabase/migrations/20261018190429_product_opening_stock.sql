/*
 * Lets create_product record opening stock for each variant in the same
 * transaction. If anything fails, nothing is saved: no product, no variants
 * and no stock. Each variant in the list may now also contain opening_stock,
 * a whole number from 0 to 100000. Zero or missing means no opening stock.
 *
 * This replaces the function from the catalogue migration. The signature is the
 * same, so the existing permissions stay in place.
 */
create or replace function public.create_product(
  target_shop_id uuid,
  product_name text,
  product_category text,
  product_price_minor integer,
  product_description text,
  initial_status public.product_status,
  variant_list jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_product_id uuid;
  new_variant_id uuid;
  variant_element jsonb;
  variant_row record;
begin
  if jsonb_typeof(variant_list) is distinct from 'array'
     or jsonb_array_length(variant_list) < 1 then
    raise exception 'A product needs at least one variant' using errcode = '22023';
  end if;

  if jsonb_array_length(variant_list) > 50 then
    raise exception 'A product can have at most 50 variants' using errcode = '54000';
  end if;

  insert into public.products (shop_id, category_code, name, description, price_minor, status)
  values (
    target_shop_id,
    product_category,
    product_name,
    product_description,
    product_price_minor,
    initial_status
  )
  returning id into new_product_id;

  for variant_element in select value from jsonb_array_elements(variant_list)
  loop
    select * into variant_row
    from jsonb_to_record(variant_element) as v(
      sku text, size text, colour text, shade text,
      volume_ml integer, expires_on date, price_minor integer,
      opening_stock integer
    );

    if coalesce(variant_row.opening_stock, 0) < 0
       or coalesce(variant_row.opening_stock, 0) > 100000 then
      raise exception 'Opening stock must be between 0 and 100000' using errcode = '22023';
    end if;

    insert into public.product_variants (
      shop_id, product_id, sku, size, colour, shade, volume_ml, expires_on, price_minor
    )
    values (
      target_shop_id, new_product_id, variant_row.sku, variant_row.size, variant_row.colour,
      variant_row.shade, variant_row.volume_ml, variant_row.expires_on, variant_row.price_minor
    )
    returning id into new_variant_id;

    if coalesce(variant_row.opening_stock, 0) > 0 then
      perform public.record_stock_movement(new_variant_id, variant_row.opening_stock, 'opening');
    end if;
  end loop;

  return new_product_id;
end;
$$;
