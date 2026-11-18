/*
  Chunk 23b: tests that try to break get_public_shop.
  Fixture: alphashop (active, the shop we read), betashop (active, another tenant),
  gammashop (suspended). Fixture rows are inserted with triggers switched off so the
  test does not depend on trigger details. The checks below prove the fixture exists,
  so the tests cannot pass on an empty database.
*/

begin;

select plan(43);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'gammashop', 'Gamma Shop', 'KE', 'KES', 'en', 'suspended', now(), now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Live dress', 'A nice dress', 150000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Draft dress', null, 150000, 'KES', 'draft', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Archived dress', null, 150000, 'KES', 'archived', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Hidden dress', null, 150000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bags', 'Beta bag', null, 90000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'shoes', 'Gamma shoes', null, 120000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'S', 'red', true, 160000, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'M', 'red', true, null, now() + interval '1 second', now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'L', 'red', false, null, now() + interval '2 seconds', now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'blue', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'M', 'green', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'One size', 'black', true, null, now(), now());

/* The second photo is inserted first on purpose, so the test proves the sort order. */
insert into public.product_images (id, shop_id, product_id, sort_order, storage_path, width, height, byte_size, created_at) values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 2,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd2.jpg', 600, 600, 90000, now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1.webp', 800, 1200, 100000, now());

insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, created_at) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 3, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', -3, 'sale', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 9, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 2, 'opening', now());

set local session_replication_role = origin;

/* Call the function as the anonymous visitor and keep the answers in settings, so the checks run as the normal test user. */
set local role anon;

do $$
begin
  perform set_config('test.r1', coalesce(public.get_public_shop('alphashop')::text, 'NULL'), true);
  perform set_config('test.r_beta', coalesce(public.get_public_shop('betashop')::text, 'NULL'), true);
  perform set_config('test.r_page2', coalesce(public.get_public_shop('alphashop', 1)::text, 'NULL'), true);
  perform set_config('test.r_missing', coalesce(public.get_public_shop('no-such-shop')::text, 'NULL'), true);
  perform set_config('test.r_suspended', coalesce(public.get_public_shop('gammashop')::text, 'NULL'), true);
  perform set_config('test.r_empty', coalesce(public.get_public_shop('')::text, 'NULL'), true);
  perform set_config('test.r_long', coalesce(public.get_public_shop(repeat('a', 70))::text, 'NULL'), true);
  perform set_config('test.r_inject', coalesce(public.get_public_shop('alphashop'' or ''1''=''1')::text, 'NULL'), true);
  perform set_config('test.r_negative', coalesce(public.get_public_shop('alphashop', -1)::text, 'NULL'), true);
end;
$$;

reset role;

/* A signed in user with no session claims must see nothing in the tables either. */
set local role authenticated;

do $$
begin
  perform set_config('test.n_products', (select count(*) from public.products)::text, true);
  perform set_config('test.n_shops', (select count(*) from public.shops)::text, true);
end;
$$;

reset role;

/* Fixture proof */
select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop', 'gammashop')), 3, 'fixture: three shops exist');
select is((select count(*)::int from public.products where name in ('Live dress', 'Draft dress', 'Archived dress', 'Hidden dress', 'Beta bag', 'Gamma shoes')), 6, 'fixture: six products exist');

/* Permissions */
select has_function('public', 'get_public_shop', array['text', 'integer'], 'get_public_shop exists');
select is(has_function_privilege('anon', 'public.get_public_shop(text, integer)', 'execute'), true, 'anon can run get_public_shop');
select is(has_function_privilege('authenticated', 'public.get_public_shop(text, integer)', 'execute'), true, 'authenticated can run get_public_shop');
select is(has_table_privilege('anon', 'public.products', 'SELECT'), false, 'anon cannot read products directly');
select is(has_table_privilege('anon', 'public.product_variants', 'SELECT'), false, 'anon cannot read variants directly');
select is(has_table_privilege('anon', 'public.product_images', 'SELECT'), false, 'anon cannot read photo records directly');
select is(has_table_privilege('anon', 'public.stock_movements', 'SELECT'), false, 'anon cannot read stock directly');
select is(has_table_privilege('anon', 'public.shops', 'SELECT'), false, 'anon cannot read shops directly');
select is(has_table_privilege('anon', 'public.variant_stock', 'SELECT'), false, 'anon cannot read the stock view');
select is(has_table_privilege('anon', 'public.countries', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), false, 'anon has no write permission on countries');
select is(has_table_privilege('authenticated', 'public.countries', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), false, 'authenticated has no write permission on countries');
select is(has_table_privilege('anon', 'public.countries', 'SELECT'), true, 'anon can still read countries');
select is(has_function_privilege('anon', 'public.set_updated_at()', 'execute'), false, 'anon cannot run set_updated_at');

/* Behaviour of the live shop */
select isnt(current_setting('test.r1'), 'NULL', 'the live shop is returned');
select is(current_setting('test.r1')::jsonb ->> 'name', 'Alpha Shop', 'the shop name is returned');
select is(jsonb_array_length(current_setting('test.r1')::jsonb -> 'products'), 1, 'only one product is live with an active variant');
select is(current_setting('test.r1')::jsonb #>> '{products,0,name}', 'Live dress', 'the live product is returned');
select is(current_setting('test.r1') ~ '(Draft dress|Archived dress|Hidden dress|Beta bag|Gamma shoes)', false, 'draft, archived, no variant and other shop products are hidden');
select is(jsonb_array_length(current_setting('test.r1')::jsonb #> '{products,0,variants}'), 2, 'the inactive variant is hidden');
select is(jsonb_path_query_first(current_setting('test.r1')::jsonb, '$.products[0].variants[*] ? (@.size == "S").in_stock')::text, 'true', 'size S is in stock');
select is(jsonb_path_query_first(current_setting('test.r1')::jsonb, '$.products[0].variants[*] ? (@.size == "M").in_stock')::text, 'false', 'size M is sold out');
select is(jsonb_path_query_first(current_setting('test.r1')::jsonb, '$.products[0].variants[*] ? (@.size == "L")') is null, true, 'size L (inactive) is not returned');
select is(jsonb_path_query_first(current_setting('test.r1')::jsonb, '$.products[0].variants[*] ? (@.size == "S").price_minor')::text, '160000', 'a variant price is used when it exists');
select is(jsonb_path_query_first(current_setting('test.r1')::jsonb, '$.products[0].variants[*] ? (@.size == "M").price_minor')::text, '150000', 'the product price is used when the variant has none');
select is(current_setting('test.r1') ~ '(on_hand|quantity)', false, 'exact stock numbers are never returned');
select is(current_setting('test.r1') ~ '(shop_id|created_by|byte_size|"sku"|expires_on)', false, 'internal fields are never returned');

/* Photos */
select is(jsonb_array_length(current_setting('test.r1')::jsonb #> '{products,0,images}'), 2, 'both photos are returned');
select is(current_setting('test.r1')::jsonb #>> '{products,0,images,0,path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1.webp', 'photos are in sort order');
select is(current_setting('test.r1')::jsonb #>> '{products,0,images,0,thumb_path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1_t.webp', 'the webp thumbnail path is built');
select is(current_setting('test.r1')::jsonb #>> '{products,0,images,1,thumb_path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd2_t.jpg', 'the jpg thumbnail path is built');
select is(current_setting('test.r1')::jsonb #>> '{products,0,images,0,width}', '800', 'the photo width is returned so photos show whole');

/* Break attempts */
select is(current_setting('test.r_missing'), 'NULL', 'an unknown shop gives null');
select is(current_setting('test.r_suspended'), 'NULL', 'a suspended shop gives null');
select is(current_setting('test.r_empty'), 'NULL', 'an empty link name gives null');
select is(current_setting('test.r_long'), 'NULL', 'a very long link name gives null');
select is(current_setting('test.r_inject'), 'NULL', 'an injection style link name gives null');
select is(current_setting('test.r_negative'), 'NULL', 'a negative offset gives null');
select is((current_setting('test.r_page2')::jsonb -> 'products')::text, '[]', 'paging past the end gives an empty list');

/* Other shop and tables */
select is(current_setting('test.r_beta')::jsonb #>> '{products,0,name}', 'Beta bag', 'another shop returns only its own product');
select is(current_setting('test.n_products'), '0', 'a signed in user without a session sees no products');
select is(current_setting('test.n_shops'), '0', 'a signed in user without a session sees no shops');

select * from finish();

rollback;
