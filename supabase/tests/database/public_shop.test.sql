begin;
select plan(15);

/* Setup as the database owner. Fixed ids keep the checks readable. */
insert into public.shops (id, slug, name, country_code, currency_code, status) values
  ('a1000000-0000-4000-8000-000000000001', 'pubtest-a', 'Pubtest Shop A', 'KE', 'KES', 'active'),
  ('a1000000-0000-4000-8000-000000000002', 'pubtest-b', 'Pubtest Shop B', 'KE', 'KES', 'active'),
  ('a1000000-0000-4000-8000-000000000003', 'pubtest-sus', 'Pubtest Suspended', 'KE', 'KES', 'suspended');

insert into public.products (id, shop_id, category_code, name, price_minor, currency_code) values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'clothes', 'Live Dress', 150000, 'KES'),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'clothes', 'Draft Item', 150000, 'KES'),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'clothes', 'Archived Item', 150000, 'KES'),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'clothes', 'Other Shop Item', 90000, 'KES'),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'clothes', 'Hidden Shop Item', 90000, 'KES');

insert into public.product_images (id, shop_id, product_id, sort_order, storage_path, width, height, byte_size) values
  (
    'c1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    1,
    'a1000000-0000-4000-8000-000000000001/b1000000-0000-4000-8000-000000000001/c1000000-0000-4000-8000-000000000001.webp',
    800, 1000, 50000
  ),
  (
    'c1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000004',
    1,
    'a1000000-0000-4000-8000-000000000002/b1000000-0000-4000-8000-000000000004/c1000000-0000-4000-8000-000000000002.webp',
    800, 1000, 50000
  ),
  (
    'c1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'b1000000-0000-4000-8000-000000000005',
    1,
    'a1000000-0000-4000-8000-000000000003/b1000000-0000-4000-8000-000000000005/c1000000-0000-4000-8000-000000000003.webp',
    800, 1000, 50000
  );

update public.products set status = 'active'
where id in (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000005'
);

update public.products set status = 'archived'
where id = 'b1000000-0000-4000-8000-000000000003';

insert into public.product_variants (id, shop_id, product_id, size, colour, price_minor, expires_on) values
  ('d1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'S', 'Red', null, null),
  ('d1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'M', 'Red', 200000, null),
  ('d1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'L', 'Red', null, '2020-01-01');

/* S has 5 in stock, M has none, L has 5 but is expired. */
insert into public.stock_movements (shop_id, variant_id, quantity_change, reason) values
  ('a1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 5, 'opening'),
  ('a1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', 5, 'opening');

/* Everything below runs as a signed out visitor. */
set local role anon;

select ok(
  has_function_privilege('anon', 'public.get_public_shop(text)', 'execute'),
  'signed out visitors can call get_public_shop'
);

select is(
  public.get_public_shop('pubtest-a') ->> 'name',
  'Pubtest Shop A',
  'an active shop is returned by its link name'
);

select is(
  jsonb_array_length(public.get_public_shop('pubtest-a') -> 'products'),
  1,
  'only the one live product is returned, not the draft or archived ones'
);

select ok(
  position('Draft Item' in public.get_public_shop('pubtest-a')::text) = 0,
  'draft products never appear'
);

select ok(
  position('Archived Item' in public.get_public_shop('pubtest-a')::text) = 0,
  'archived products never appear'
);

select ok(
  position('Other Shop Item' in public.get_public_shop('pubtest-a')::text) = 0,
  'products of another shop never appear'
);

select is(
  public.get_public_shop('pubtest-sus'),
  null::jsonb,
  'a suspended shop returns nothing'
);

select is(
  public.get_public_shop('no-such-shop-anywhere'),
  null::jsonb,
  'an unknown link name returns nothing'
);

select ok(
  position('created_by' in public.get_public_shop('pubtest-a')::text) = 0
  and position('shop_id' in public.get_public_shop('pubtest-a')::text) = 0
  and position('quantity' in public.get_public_shop('pubtest-a')::text) = 0
  and position('sku' in public.get_public_shop('pubtest-a')::text) = 0
  and position('expires_on' in public.get_public_shop('pubtest-a')::text) = 0,
  'no internal or sensitive field names appear in the result'
);

select is(
  (
    select array_agg(k order by k)
    from jsonb_object_keys(public.get_public_shop('pubtest-a') -> 'products' -> 0 -> 'variants' -> 0) as k
  ),
  array['colour', 'id', 'in_stock', 'price_minor', 'shade', 'size', 'volume_ml']::text[],
  'a variant exposes exactly the allowed fields and no stock number'
);

select is(
  (
    select count(*)
    from jsonb_array_elements(public.get_public_shop('pubtest-a') -> 'products' -> 0 -> 'variants') as v
    where (v ->> 'in_stock')::boolean
  ),
  1::bigint,
  'only the stocked, unexpired variant is in stock'
);

select is(
  (
    select count(*)
    from jsonb_array_elements(public.get_public_shop('pubtest-a') -> 'products' -> 0 -> 'variants') as v
    where not (v ->> 'in_stock')::boolean
  ),
  2::bigint,
  'the empty variant and the expired variant are both sold out'
);

select is(
  (
    select count(*)
    from jsonb_array_elements(public.get_public_shop('pubtest-a') -> 'products' -> 0 -> 'variants') as v
    where (v ->> 'price_minor')::integer = 150000
  ),
  2::bigint,
  'variants without their own price show the product price'
);

select is(
  public.get_public_shop('pubtest-a') -> 'products' -> 0 -> 'photos' -> 0 ->> 'thumb_path',
  'a1000000-0000-4000-8000-000000000001/b1000000-0000-4000-8000-000000000001/c1000000-0000-4000-8000-000000000001_t.webp',
  'the thumbnail path follows the same rule as the upload code'
);

select throws_ok(
  $$select count(*) from public.products$$,
  '42501',
  null,
  'a signed out visitor cannot read the products table directly'
);

reset role;

select * from finish();
rollback;
