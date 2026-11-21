/*
  Chunk 30b: tests that try to break set_shop_about, and check the new arrivals fields.
  Shops: alpha (about text, 1111 owner, 2222 manager, 3333 attendant), beta (no text, 4444 owner).
  Alpha products: New dress (live, new), Old dress (live, 20 days old), Draft new (draft),
  Hidden new (live, but its only variant is inactive). Beta has one live new product.
  The seed shops are switched off the shared page first, so only the fixture is counted.
*/

begin;

select plan(30);

set local session_replication_role = replica;

update public.shops set is_listed = false;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, is_listed, about, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', true, 'About alpha', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', true, null, now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'owner', true, now()),
  ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-4222-8222-222222222222', 'manager', true, now()),
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'New dress', null, 150000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Old dress', null, 150000, 'KES', 'active', now() - interval '20 days', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Draft new', null, 150000, 'KES', 'draft', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Hidden new', null, 150000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bags', 'Beta new', null, 90000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'S', 'red', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'red', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'M', 'blue', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'M', 'black', false, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'One size', 'black', true, null, now(), now());

set local session_replication_role = origin;

set local role anon;

do $$
begin
  perform set_config('test.s_alpha', coalesce(public.get_public_shop('alphashop')::text, 'NULL'), true);
  perform set_config('test.s_beta', coalesce(public.get_public_shop('betashop')::text, 'NULL'), true);
  perform set_config('test.b_all', coalesce(public.get_public_browse(0)::text, 'NULL'), true);
end;
$$;

reset role;

/* Attendant, manager, an outsider, an unknown shop and a caller with no session all try to change alpha */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Hacked');
    perform set_config('test.a_att', 'ok', true);
  exception when others then
    perform set_config('test.a_att', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Hacked');
    perform set_config('test.a_mgr', 'ok', true);
  exception when others then
    perform set_config('test.a_mgr', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Hacked');
    perform set_config('test.a_out', 'ok', true);
  exception when others then
    perform set_config('test.a_out', sqlstate, true);
  end;
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 'Hacked');
    perform set_config('test.a_unknown', 'ok', true);
  exception when others then
    perform set_config('test.a_unknown', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Hacked');
    perform set_config('test.a_none', 'ok', true);
  exception when others then
    perform set_config('test.a_none', sqlstate, true);
  end;
end;
$$;

reset role;

do $$
begin
  perform set_config('test.about_after', (select s.about from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);
end;
$$;

/* The alpha owner tries a text that is too long, then a text of exactly 500 characters */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', repeat('x', 501));
    perform set_config('test.a_long', 'ok', true);
  exception when others then
    perform set_config('test.a_long', sqlstate, true);
  end;
  begin
    perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', repeat('x', 500));
    perform set_config('test.a_ok', 'ok', true);
  exception when others then
    perform set_config('test.a_ok', sqlstate, true);
  end;
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.about_len', (select char_length(s.about)::text from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);
end;
$$;

/* The beta owner saves text with spaces around it, which must be trimmed */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '  Hello  ');
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.about_hello', coalesce((select s.about from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'), 'NULL'), true);
end;
$$;

/* Then saves only spaces, which must become empty */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  perform public.set_shop_about('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '   ');
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.about_blank', coalesce((select s.about from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'), 'NULL'), true);
end;
$$;

select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop')), 2, 'fixture: two shops exist');
select is((select count(*)::int from public.products where name in ('New dress', 'Old dress', 'Draft new', 'Hidden new', 'Beta new')), 5, 'fixture: five products exist');
select has_column('public', 'shops', 'about', 'shops has an about column');
select has_function('public', 'set_shop_about', array['uuid', 'text'], 'set_shop_about exists');
select is(has_function_privilege('anon', 'public.set_shop_about(uuid, text)', 'execute'), false, 'anon cannot run set_shop_about');
select is(has_function_privilege('authenticated', 'public.set_shop_about(uuid, text)', 'execute'), true, 'authenticated can run set_shop_about');

select is(current_setting('test.s_alpha')::jsonb ->> 'about', 'About alpha', 'the shop text is returned');
select is(current_setting('test.s_alpha')::jsonb ->> 'new_count', '1', 'only the new, live product with an active variant is counted');
select is(jsonb_array_length(current_setting('test.s_alpha')::jsonb -> 'products'), 2, 'two products are shown');
select is(current_setting('test.s_alpha')::jsonb #>> '{products,0,is_new}', 'true', 'the recent product is marked new');
select is(current_setting('test.s_alpha')::jsonb #>> '{products,1,is_new}', 'false', 'the 20 day old product is not marked new');
select is(current_setting('test.s_alpha')::jsonb #>> '{products,1,name}', 'Old dress', 'the old product comes second');
select is(current_setting('test.s_alpha') ~ '(Draft new|Hidden new|Beta new)', false, 'draft, no variant and other shop products are hidden');
select is(current_setting('test.s_beta')::jsonb ->> 'about', null::text, 'a shop with no text returns null');
select is(current_setting('test.s_beta')::jsonb ->> 'new_count', '1', 'the other shop counts its own new product');

select is(current_setting('test.b_all')::jsonb ->> 'new_count', '2', 'the shared page counts new products across listed shops');
select is(jsonb_array_length(current_setting('test.b_all')::jsonb -> 'products'), 3, 'the shared page shows three products');
select is((select count(*)::int from jsonb_array_elements(current_setting('test.b_all')::jsonb -> 'products') e where e ->> 'is_new' = 'true'), 2, 'two shared page products are marked new');
select is(current_setting('test.b_all') ~ '(shop_id|created_by|created_at|is_listed|about)', false, 'internal fields are never returned on the shared page');

select is(current_setting('test.a_att'), '42501', 'an attendant cannot change the text');
select is(current_setting('test.a_mgr'), '42501', 'a manager cannot change the text');
select is(current_setting('test.a_out'), '42501', 'the owner of another shop cannot change the text');
select is(current_setting('test.a_unknown'), '42501', 'an unknown shop gives the same refusal');
select is(current_setting('test.a_none'), '42501', 'a caller with no session is refused');
select is(current_setting('test.about_after'), 'About alpha', 'the text is unchanged after the refused attempts');

select is(current_setting('test.a_long'), '22023', 'a text above 500 characters is refused');
select is(current_setting('test.a_ok'), 'ok', 'the owner can save 500 characters');
select is(current_setting('test.about_len'), '500', 'all 500 characters are stored');
select is(current_setting('test.about_hello'), 'Hello', 'spaces around the text are trimmed');
select is(current_setting('test.about_blank'), 'NULL', 'a text of only spaces becomes empty');

select * from finish();

rollback;
