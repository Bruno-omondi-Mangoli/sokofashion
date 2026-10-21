/*
 * Tests for categories, products and product variants.
 * Cast of characters:
 *   alice  owner of Shop A
 *   mia    manager at Shop A
 *   carol  attendant at Shop A
 *   frank  attendant at Shop A whose access was revoked
 *   bob    owner of Shop B, a rival
 *   anon   an anonymous visitor
 */
begin;

select plan(39);

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

create function tests.become_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

/* Setup, done as the database administrator */
insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'mia@example.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test', now()),
  ('44444444-4444-4444-4444-444444444444', 'bob@example.test', now()),
  ('55555555-5555-5555-5555-555555555555', 'frank@example.test', now());

insert into public.shops (id, slug, name, country_code, currency_code) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice-fashion', 'Alice Fashion', 'KE', 'KES'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob-beauty', 'Bob Beauty', 'KE', 'KES');

insert into public.shop_members (shop_id, user_id, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'manager', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'attendant', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'attendant', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'owner', true);

/* Bob already sells one product */
insert into public.products (id, shop_id, category_code, name, price_minor, status) values
  ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cosmetics', 'Bob Lip Gloss', 90000, 'draft');
insert into public.product_variants (shop_id, product_id, shade) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'Rose');

/* An anonymous visitor */
select tests.become_anon();

select is(
  (select count(*) from public.categories)::int, 4,
  'anonymous visitors can read the four categories'
);

select throws_ok(
  $$ select * from public.products $$,
  '42501',
  'permission denied for table products',
  'anonymous visitors cannot read products'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anon Dress', 'clothes', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '42501',
  'permission denied for function create_product',
  'anonymous visitors cannot create products'
);

/* Alice, owner of Shop A */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select set_config('tests.dress', public.create_product(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kitenge Dress', 'clothes', 350000,
       'A bright kitenge dress', 'draft',
       '[{"size":"M","colour":"Red","sku":"KD-M-R"},{"size":"L","colour":"Red","sku":"KD-L-R"}]'::jsonb
     )::text, true) $$,
  'alice can create a product with two variants'
);

select is(
  (select currency_code from public.products where id = current_setting('tests.dress')::uuid),
  'KES',
  'the currency is copied from the shop'
);

select is(
  (select created_by from public.products where id = current_setting('tests.dress')::uuid),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'the database records who created the product'
);

select is(
  (select count(*) from public.product_variants where product_id = current_setting('tests.dress')::uuid)::int, 2,
  'both variants were created with the product'
);

select lives_ok(
  $$ select set_config('tests.gloss', public.create_product(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Matte Lipstick', 'cosmetics', 120000,
       null, 'draft',
       '[{"shade":"Plum","volume_ml":5,"expires_on":"2028-06-30"}]'::jsonb
     )::text, true) $$,
  'alice can create a cosmetic with volume and expiry date'
);

select is(
  (select volume_ml from public.product_variants where product_id = current_setting('tests.gloss')::uuid),
  5,
  'the cosmetic volume is stored'
);

select lives_ok(
  $$ update public.products set price_minor = 400000 where id = current_setting('tests.dress')::uuid $$,
  'alice can change a product price'
);

select is(
  (select price_minor from public.products where id = current_setting('tests.dress')::uuid),
  400000,
  'the new price is saved'
);

select lives_ok(
  $$ update public.products set status = 'archived' where id = current_setting('tests.gloss')::uuid $$,
  'alice can archive a product'
);

select throws_ok(
  $$ delete from public.products where id = current_setting('tests.dress')::uuid $$,
  '42501',
  'permission denied for table products',
  'nobody can delete a product through the API'
);

select throws_ok(
  $$ update public.products set shop_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
     where id = current_setting('tests.dress')::uuid $$,
  '42501',
  'permission denied for table products',
  'a product cannot be moved to another shop'
);

select throws_ok(
  $$ update public.products set currency_code = 'USD'
     where id = current_setting('tests.dress')::uuid $$,
  '42501',
  'permission denied for table products',
  'the currency cannot be changed directly'
);

select throws_ok(
  $$ insert into public.products (shop_id, category_code, name, price_minor, currency_code)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clothes', 'Sneaky', 1000, 'USD') $$,
  '42501',
  'permission denied for table products',
  'the currency cannot be chosen on insert'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bad Price', 'clothes', -1, null, 'draft', '[{}]'::jsonb) $$,
  '23514',
  'new row for relation "products" violates check constraint "products_price_minor_check"',
  'a negative price is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Huge Price', 'clothes', 100000001, null, 'draft', '[{}]'::jsonb) $$,
  '23514',
  'new row for relation "products" violates check constraint "products_price_minor_check"',
  'an absurdly high price is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'No Variants', 'clothes', 1000, null, 'draft', '[]'::jsonb) $$,
  '22023',
  'A product needs at least one variant',
  'a product without variants is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Twins', 'clothes', 1000, null, 'draft',
       '[{"size":"M","colour":"Blue"},{"size":"m","colour":"blue"}]'::jsonb) $$,
  '23505',
  'duplicate key value violates unique constraint "product_variants_options_unique"',
  'the same options cannot be listed twice, whatever the letter case'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Toy Car', 'toys', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '23503',
  'insert or update on table "products" violates foreign key constraint "products_category_code_fkey"',
  'an unknown category is refused'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Copy Dress', 'clothes', 1000, null, 'draft',
       '[{"size":"S","sku":"kd-m-r"}]'::jsonb) $$,
  '23505',
  'duplicate key value violates unique constraint "product_variants_sku_unique"',
  'a product code cannot be reused inside one shop'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Giant', 'clothes', 1000, null, 'draft',
       (select jsonb_agg(jsonb_build_object('size', n::text)) from generate_series(1, 51) as n)) $$,
  '54000',
  'A product can have at most 50 variants',
  'a product cannot be created with more than 50 variants'
);

select throws_ok(
  $$ insert into public.product_variants (shop_id, product_id, size)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'S') $$,
  '23503',
  'insert or update on table "product_variants" violates foreign key constraint "product_variants_product_fk"',
  'alice cannot attach a variant to the rival product'
);

select throws_ok(
  $$ insert into public.product_variants (shop_id, product_id, size)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'S') $$,
  '42501',
  'new row violates row-level security policy for table "product_variants"',
  'alice cannot add variants inside the rival shop'
);

select throws_ok(
  $$ select public.create_product('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Planted', 'clothes', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'alice cannot create a product in the rival shop'
);

/* Mia, manager at Shop A */
reset role;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222');

select lives_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Leather Bag', 'bags', 450000, null, 'draft', '[{"colour":"Brown"}]'::jsonb) $$,
  'a manager can create a product'
);

select lives_ok(
  $$ update public.products set price_minor = 420000 where id = current_setting('tests.dress')::uuid $$,
  'a manager can change a price'
);

/* Carol, attendant at Shop A */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select is(
  (select count(*) from public.products where id = current_setting('tests.dress')::uuid)::int, 1,
  'an attendant can read the catalogue'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Attendant Dress', 'clothes', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'an attendant cannot create a product'
);

/* The attendant tries to cut the price. It must silently change nothing. */
update public.products set price_minor = 1 where id = current_setting('tests.dress')::uuid;

select throws_ok(
  $$ insert into public.product_variants (shop_id, product_id, size)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_setting('tests.dress')::uuid, 'XL') $$,
  '42501',
  'new row violates row-level security policy for table "product_variants"',
  'an attendant cannot add a variant'
);

/* Frank, whose access was revoked */
reset role;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');

select is(
  (select count(*) from public.products)::int, 0,
  'a revoked member sees no products'
);

/* Bob, owner of the rival Shop B */
reset role;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select is(
  (select count(*) from public.products where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0,
  'bob cannot see products of the rival shop'
);

select is(
  (select count(*) from public.product_variants where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0,
  'bob cannot see variants of the rival shop'
);

/* Bob tries to rename the rival product. It must silently change nothing. */
update public.products set name = 'Hacked by Bob' where id = current_setting('tests.dress')::uuid;

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Planted', 'clothes', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'bob cannot create a product in the rival shop'
);

/* Back to administrator to confirm the attacks changed nothing */
reset role;

select is(
  (select price_minor from public.products where id = current_setting('tests.dress')::uuid),
  420000,
  'the attendant did not change the price'
);

select is(
  (select name from public.products where id = current_setting('tests.dress')::uuid),
  'Kitenge Dress',
  'bob did not change the rival product name'
);

/* Limits. The administrator fills the shop to the edge, then a real user tries once more. */
insert into public.products (shop_id, category_code, name, price_minor)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'clothes', 'Filler ' || n, 1000
from generate_series(1, 999) as n;

select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select throws_ok(
  $$ select public.create_product('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'One Too Many', 'clothes', 1000, null, 'draft', '[{}]'::jsonb) $$,
  '54000',
  'This shop has reached the limit of 1000 products',
  'a shop cannot have more than 1000 products'
);

reset role;

insert into public.product_variants (shop_id, product_id, colour)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_setting('tests.dress')::uuid, 'Shade ' || n
from generate_series(1, 48) as n;

select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ insert into public.product_variants (shop_id, product_id, size)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_setting('tests.dress')::uuid, 'XXL') $$,
  '54000',
  'A product can have at most 50 variants',
  'a product cannot have more than 50 variants'
);

select * from finish();

rollback;
