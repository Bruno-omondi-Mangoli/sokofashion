/*
  Chunk 25: tests that try to break get_public_browse and set_shop_listed.
  Shops: alpha (active, listed, the one we opt out), beta (active, already opted out),
  gamma (suspended, listed), delta (active, listed).
  Each hidden product is hidden for exactly one reason, so a broken filter is caught.
  Alpha draft has an active variant, alpha hidden has none, beta is opted out,
  gamma is suspended.
  People: 1111 owner of alpha, 2222 manager of alpha, 3333 attendant of alpha, 4444 owner of beta.
*/

begin;

select plan(41);

set local session_replication_role = replica;

/* Switch every shop that already exists (such as the seed shops) off the shared page, so only the fixture shops below are counted. The test rolls back, so nothing stays changed. */
update public.shops set is_listed = false;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, is_listed, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', true, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', false, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'gammashop', 'Gamma Shop', 'KE', 'KES', 'en', 'suspended', true, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'deltashop', 'Delta Shop', 'KE', 'KES', 'en', 'active', true, now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'owner', true, now()),
  ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-4222-8222-222222222222', 'manager', true, now()),
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Alpha live', null, 150000, 'KES', 'active', now() - interval '3 hours', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Alpha draft', null, 150000, 'KES', 'draft', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Alpha soldout', null, 150000, 'KES', 'active', now() - interval '2 hours', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bags', 'Beta item', null, 90000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'shoes', 'Gamma item', null, 120000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'shoes', 'Delta item', null, 80000, 'KES', 'active', now() - interval '1 hour', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Alpha hidden', null, 150000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'S', 'red', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'M', 'red', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'blue', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', '38', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'M', 'black', false, null, now(), now());

/* The sort order 2 photo is inserted first on purpose, so the test proves the cover is sort order 1 */
insert into public.product_images (id, shop_id, product_id, sort_order, storage_path, width, height, byte_size, created_at) values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 2,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd1.jpg', 600, 600, 90000, now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd2.webp', 800, 1200, 100000, now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3/dddddddd-dddd-4ddd-8ddd-ddddddddddd3.webp', 900, 900, 100000, now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6/dddddddd-dddd-4ddd-8ddd-ddddddddddd4.webp', 1200, 800, 100000, now());

insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, created_at) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 2, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', -2, 'sale', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 9, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 9, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 9, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 1, 'opening', now());

set local session_replication_role = origin;

/* The visitor looks at the shared page before anything changes */
set local role anon;

do $$
begin
  perform set_config('test.b_before', coalesce(public.get_public_browse(0)::text, 'NULL'), true);
  perform set_config('test.b_neg', coalesce(public.get_public_browse(-1)::text, 'NULL'), true);
  perform set_config('test.b_huge', coalesce(public.get_public_browse(100001)::text, 'NULL'), true);
  perform set_config('test.b_end', coalesce(public.get_public_browse(1000)::text, 'NULL'), true);
  perform set_config('test.b_page2', coalesce(public.get_public_browse(1)::text, 'NULL'), true);
end;
$$;

reset role;

/* Attendant, manager and the owner of another shop all try to change alpha */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
    perform set_config('test.d_attendant', 'no error', true);
  exception when others then
    perform set_config('test.d_attendant', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
    perform set_config('test.d_manager', 'no error', true);
  exception when others then
    perform set_config('test.d_manager', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
    perform set_config('test.d_outsider', 'no error', true);
  exception when others then
    perform set_config('test.d_outsider', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.listed_denied', (select is_listed::text from public.shops where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);
end;
$$;

/* The alpha owner opts out, tries a shop that does not exist, and the beta owner opts in */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
    perform set_config('test.d_owner', 'no error', true);
  exception when others then
    perform set_config('test.d_owner', sqlstate, true);
  end;

  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', false);
    perform set_config('test.d_random', 'no error', true);
  exception when others then
    perform set_config('test.d_random', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.set_shop_listed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', true);
    perform set_config('test.d_beta', 'no error', true);
  exception when others then
    perform set_config('test.d_beta', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.listed_alpha', (select is_listed::text from public.shops where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);
  perform set_config('test.listed_beta', (select is_listed::text from public.shops where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'), true);
end;
$$;

/* The visitor looks again */
set local role anon;

do $$
begin
  perform set_config('test.b_after', coalesce(public.get_public_browse(0)::text, 'NULL'), true);
end;
$$;

reset role;

/* Fixture proof, permissions and defaults */
select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop', 'gammashop', 'deltashop')), 4, 'fixture: four shops exist');
select is((select count(*)::int from public.products where name in ('Alpha live', 'Alpha draft', 'Alpha soldout', 'Beta item', 'Gamma item', 'Delta item', 'Alpha hidden')), 7, 'fixture: seven products exist');
select has_function('public', 'get_public_browse', array['integer'], 'get_public_browse exists');
select has_function('public', 'set_shop_listed', array['uuid', 'boolean'], 'set_shop_listed exists');
select is(has_function_privilege('anon', 'public.get_public_browse(integer)', 'execute'), true, 'anon can run get_public_browse');
select is(has_function_privilege('authenticated', 'public.get_public_browse(integer)', 'execute'), true, 'authenticated can run get_public_browse');
select is(has_function_privilege('anon', 'public.set_shop_listed(uuid, boolean)', 'execute'), false, 'anon cannot run set_shop_listed');
select is(has_function_privilege('authenticated', 'public.set_shop_listed(uuid, boolean)', 'execute'), true, 'authenticated can run set_shop_listed');
select is(has_table_privilege('anon', 'public.shops', 'UPDATE'), false, 'anon cannot update shops directly');
select is(has_table_privilege('authenticated', 'public.shops', 'UPDATE'), false, 'authenticated cannot update shops directly');
select is(has_table_privilege('anon', 'public.shops', 'SELECT'), false, 'anon cannot read shops directly');
select is((select column_default from information_schema.columns where table_schema = 'public' and table_name = 'shops' and column_name = 'is_listed'), 'true', 'shops are listed by default');

/* The shared page before any change */
select isnt(current_setting('test.b_before'), 'NULL', 'the shared page answers');
select is(jsonb_array_length(current_setting('test.b_before')::jsonb -> 'products'), 3, 'only three products are shown');
select is(current_setting('test.b_before')::jsonb #>> '{products,0,name}', 'Delta item', 'the newest product comes first');
select is(current_setting('test.b_before')::jsonb #>> '{products,0,shop,slug}', 'deltashop', 'each product carries its shop link name');
select is(current_setting('test.b_before')::jsonb #>> '{products,1,name}', 'Alpha soldout', 'a sold out product is still shown');
select is(current_setting('test.b_before')::jsonb #>> '{products,1,in_stock}', 'false', 'the sold out product is marked sold out');
select is(current_setting('test.b_before')::jsonb #>> '{products,2,name}', 'Alpha live', 'the oldest product comes last');
select is(current_setting('test.b_before')::jsonb #>> '{products,2,in_stock}', 'true', 'the stocked product is marked in stock');
select is(current_setting('test.b_before') ~ '(Alpha draft|Alpha hidden|Beta item|Gamma item)', false, 'draft, no variant, opted out and suspended products are hidden');
select is(current_setting('test.b_before')::jsonb #>> '{products,2,cover,path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd2.webp', 'the cover is the first photo');
select is(current_setting('test.b_before')::jsonb #>> '{products,2,cover,thumb_path}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1/dddddddd-dddd-4ddd-8ddd-ddddddddddd2_t.webp', 'the cover thumbnail path is built');
select is(current_setting('test.b_before')::jsonb #>> '{products,2,cover,width}', '800', 'the cover width is returned so photos show whole');
select is(current_setting('test.b_before') ~ '(on_hand|quantity|shop_id|created_by|byte_size|"sku"|expires_on|is_listed)', false, 'stock numbers and internal fields are never returned');
select is(current_setting('test.b_neg'), 'NULL', 'a negative offset gives null');
select is(current_setting('test.b_huge'), 'NULL', 'a huge offset gives null');
select is((current_setting('test.b_end')::jsonb -> 'products')::text, '[]', 'paging past the end gives an empty list');
select is(jsonb_array_length(current_setting('test.b_page2')::jsonb -> 'products'), 2, 'offset 1 skips the first product');

/* Who may change a listing */
select is(current_setting('test.d_attendant'), '42501', 'an attendant cannot change the listing');
select is(current_setting('test.d_manager'), '42501', 'a manager cannot change the listing');
select is(current_setting('test.d_outsider'), '42501', 'the owner of another shop cannot change the listing');
select is(current_setting('test.listed_denied'), 'true', 'the shop is still listed after the refused attempts');
select is(current_setting('test.d_owner'), 'no error', 'the owner can opt out');
select is(current_setting('test.d_random'), '42501', 'an unknown shop gives the same refusal');
select is(current_setting('test.listed_alpha'), 'false', 'alpha is now opted out');
select is(current_setting('test.listed_beta'), 'true', 'beta is now opted in');

/* The shared page after the changes */
select is(jsonb_array_length(current_setting('test.b_after')::jsonb -> 'products'), 2, 'two products are shown after the changes');
select is(current_setting('test.b_after') ~ 'Alpha', false, 'the opted out shop disappears at once');
select is(current_setting('test.b_after') ~ 'Beta item', true, 'the shop that opted in appears');
select is(current_setting('test.b_after') ~ 'Gamma item', false, 'the suspended shop stays hidden');

select * from finish();

rollback;
