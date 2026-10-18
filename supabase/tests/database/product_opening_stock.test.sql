/*
 * Tests for opening stock created together with a product.
 * Cast of characters:
 *   alice  owner of Shop A
 *   carol  attendant at Shop A
 *   bob    owner of Shop B, a rival
 */
begin;

select plan(15);

create schema tests;

create function tests.authenticate_as(caller_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', caller_id, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', caller_id::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

/* Setup, done as the database administrator */
insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test', now()),
  ('44444444-4444-4444-4444-444444444444', 'bob@example.test', now());

insert into public.shops (id, slug, name, country_code, currency_code) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice-fashion', 'Alice Fashion', 'KE', 'KES'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob-beauty', 'Bob Beauty', 'KE', 'KES');

insert into public.shop_members (shop_id, user_id, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'attendant', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'owner', true);

/* Alice, owner of Shop A */
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select set_config('tests.dress', public.create_product(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kitenge Dress', 'clothes', 350000, null, 'draft',
       '[{"size":"M","colour":"Red","opening_stock":5},{"size":"L","colour":"Red","opening_stock":3}]'::jsonb
     )::text, true) $$,
  'alice can create a product with opening stock'
);

select is(
  (select count(*) from public.stock_movements
    where reason = 'opening'
      and variant_id in (select id from public.product_variants where product_id = current_setting('tests.dress')::uuid))::int,
  2,
  'one opening movement is recorded for each variant with stock'
);

select is(
  (select sum(on_hand) from public.variant_stock where product_id = current_setting('tests.dress')::uuid)::int,
  8,
  'the total in stock matches the opening quantities'
);

select is(
  (select on_hand from public.variant_stock
    where product_id = current_setting('tests.dress')::uuid
      and variant_id = (select id from public.product_variants
                         where product_id = current_setting('tests.dress')::uuid and size = 'M')),
  5,
  'each variant gets its own opening quantity'
);

select is(
  (select count(*) from public.stock_movements
    where created_by = '11111111-1111-1111-1111-111111111111'
      and variant_id in (select id from public.product_variants where product_id = current_setting('tests.dress')::uuid))::int,
  2,
  'the database records who entered the opening stock'
);

select lives_ok(
  $$ select set_config('tests.zero', public.create_product(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zero Stock Dress', 'clothes', 100000, null, 'draft',
       '[{"size":"S","opening_stock":0},{"size":"L"}]'::jsonb
     )::text, true) $$,
  'variants with zero or missing opening stock are created'
);

select is(
  (select count(*) from public.stock_movements
    where variant_id in (select id from public.product_variants where product_id = current_setting('tests.zero')::uuid))::int,
  0,
  'zero opening stock records no movement'
);

select lives_ok(
  $$ select set_config('tests.simple', public.create_product(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Plain Scarf', 'clothes', 50000, null, 'draft',
       '[{"opening_stock":12}]'::jsonb
     )::text, true) $$,
  'a simple product can have opening stock'
);

select is(
  (select on_hand from public.variant_stock where product_id = current_setting('tests.simple')::uuid),
  12,
  'the simple product shows its opening stock'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Negative', 'clothes', 1000, null, 'draft',
       '[{"size":"S","opening_stock":-1}]'::jsonb) $$,
  '22023',
  'Opening stock must be between 0 and 100000',
  'a negative opening stock is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Too Much', 'clothes', 1000, null, 'draft',
       '[{"size":"S","opening_stock":100001}]'::jsonb) $$,
  '22023',
  'Opening stock must be between 0 and 100000',
  'an absurdly large opening stock is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Half Item', 'clothes', 1000, null, 'draft',
       '[{"size":"S","opening_stock":2.5}]'::jsonb) $$,
  '22P02',
  'invalid input syntax for type integer: "2.5"',
  'a fractional opening stock is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Atomic Test', 'clothes', 1000, null, 'draft',
       '[{"size":"S","opening_stock":4},{"size":"M","opening_stock":-1}]'::jsonb) $$,
  '22023',
  'Opening stock must be between 0 and 100000',
  'a failed creation is refused'
);

select is(
  (select count(*) from public.products where name = 'Atomic Test')::int,
  0,
  'a failed creation leaves no product behind'
);

/* Carol, attendant at Shop A */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Attendant Dress', 'clothes', 1000, null, 'draft',
       '[{"size":"S","opening_stock":50}]'::jsonb) $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'an attendant cannot create a product with stock'
);

select * from finish();

rollback;
