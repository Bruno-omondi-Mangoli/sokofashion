/*
  Chunk 24a: tests that try to break get_public_product.
  Fixture: alphashop (active), betashop (active, another tenant), gammashop (suspended).
  P1 live, P2 draft, P3 archived, P4 live but its only variant is inactive,
  P5 live in betashop, P6 live in the suspended shop.
  Draft and archived products each have an active variant, so only their status hides them.
*/

begin;

select plan(23);

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
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'blue', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'M', 'green', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'M', 'black', false, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'One size', 'black', true, null, now(), now());

insert into public.product_images (id, shop_id, product_id, sort_order, storage_path, width, height, byte_size, created_at) values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1.webp', 800, 1200, 100000, now());

insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, created_at) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 3, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', -3, 'sale', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 9, 'opening', now());

set local session_replication_role = origin;

set local role anon;

do $$
begin
  perform set_config('test.p_live', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')::text, 'NULL'), true);
  perform set_config('test.p_draft', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2')::text, 'NULL'), true);
  perform set_config('test.p_archived', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3')::text, 'NULL'), true);
  perform set_config('test.p_hidden', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4')::text, 'NULL'), true);
  perform set_config('test.p_wrongshop', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5')::text, 'NULL'), true);
  perform set_config('test.p_suspended', coalesce(public.get_public_product('gammashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6')::text, 'NULL'), true);
  perform set_config('test.p_unknown', coalesce(public.get_public_product('no-such-shop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')::text, 'NULL'), true);
  perform set_config('test.p_inject', coalesce(public.get_public_product('alphashop'' or ''1''=''1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1')::text, 'NULL'), true);
  perform set_config('test.p_random', coalesce(public.get_public_product('alphashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9')::text, 'NULL'), true);
  perform set_config('test.p_beta', coalesce(public.get_public_product('betashop', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5')::text, 'NULL'), true);
end;
$$;

reset role;

/* Fixture proof */
select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop', 'gammashop')), 3, 'fixture: three shops exist');
select is((select count(*)::int from public.products where name in ('Live dress', 'Draft dress', 'Archived dress', 'Hidden dress', 'Beta bag', 'Gamma shoes')), 6, 'fixture: six products exist');

/* Permissions */
select has_function('public', 'get_public_product', array['text', 'uuid'], 'get_public_product exists');
select is(has_function_privilege('anon', 'public.get_public_product(text, uuid)', 'execute'), true, 'anon can run get_public_product');
select is(has_function_privilege('authenticated', 'public.get_public_product(text, uuid)', 'execute'), true, 'authenticated can run get_public_product');

/* Behaviour of the live product */
select isnt(current_setting('test.p_live'), 'NULL', 'the live product is returned');
select is(current_setting('test.p_live')::jsonb #>> '{shop,name}', 'Alpha Shop', 'the shop name is returned');
select is(current_setting('test.p_live')::jsonb #>> '{product,name}', 'Live dress', 'the product name is returned');
select is(jsonb_array_length(current_setting('test.p_live')::jsonb #> '{product,variants}'), 2, 'the inactive variant is hidden');
select is(jsonb_path_query_first(current_setting('test.p_live')::jsonb, '$.product.variants[*] ? (@.size == "S").in_stock')::text, 'true', 'size S is in stock');
select is(jsonb_path_query_first(current_setting('test.p_live')::jsonb, '$.product.variants[*] ? (@.size == "M").in_stock')::text, 'false', 'size M is sold out');
select is(jsonb_path_query_first(current_setting('test.p_live')::jsonb, '$.product.variants[*] ? (@.size == "M").price_minor')::text, '150000', 'the product price is used when the variant has none');
select is(current_setting('test.p_live')::jsonb #>> '{product,images,0,thumb_path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1_t.webp', 'the thumbnail path is built');
select is(current_setting('test.p_live') ~ '(on_hand|quantity|shop_id|created_by|byte_size|"sku"|expires_on)', false, 'stock numbers and internal fields are never returned');

/* Break attempts */
select is(current_setting('test.p_draft'), 'NULL', 'a draft product gives null');
select is(current_setting('test.p_archived'), 'NULL', 'an archived product gives null');
select is(current_setting('test.p_hidden'), 'NULL', 'a product with no active variant gives null');
select is(current_setting('test.p_wrongshop'), 'NULL', 'a product asked through another shop link gives null');
select is(current_setting('test.p_suspended'), 'NULL', 'a product of a suspended shop gives null');
select is(current_setting('test.p_unknown'), 'NULL', 'an unknown shop gives null');
select is(current_setting('test.p_inject'), 'NULL', 'an injection style link name gives null');
select is(current_setting('test.p_random'), 'NULL', 'an unknown product id gives null');
select is(current_setting('test.p_beta')::jsonb #>> '{product,name}', 'Beta bag', 'a product asked through its own shop link works');

select * from finish();

rollback;
