/*
  Chunk 28: tests that try to break get_public_checkout_info.
  Shops: alpha (paid delivery 300), beta (pickup only), gamma (suspended).
*/

begin;

select plan(15);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, delivery_mode, delivery_fee_minor, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', 'paid_delivery', 30000, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', 'pickup_only', 0, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'gammashop', 'Gamma Shop', 'KE', 'KES', 'en', 'suspended', 'pickup_only', 0, now(), now());

set local session_replication_role = origin;

set local role anon;

do $$
begin
  perform set_config('test.r_alpha', coalesce(public.get_public_checkout_info('alphashop')::text, 'NULL'), true);
  perform set_config('test.r_beta', coalesce(public.get_public_checkout_info('betashop')::text, 'NULL'), true);
  perform set_config('test.r_susp', coalesce(public.get_public_checkout_info('gammashop')::text, 'NULL'), true);
  perform set_config('test.r_unknown', coalesce(public.get_public_checkout_info('no-such-shop')::text, 'NULL'), true);
  perform set_config('test.r_inject', coalesce(public.get_public_checkout_info('alphashop'' or ''1''=''1')::text, 'NULL'), true);
  perform set_config('test.r_empty', coalesce(public.get_public_checkout_info('')::text, 'NULL'), true);
  perform set_config('test.r_long', coalesce(public.get_public_checkout_info(repeat('a', 70))::text, 'NULL'), true);
end;
$$;

reset role;

select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop', 'gammashop')), 3, 'fixture: three shops exist');
select has_function('public', 'get_public_checkout_info', array['text'], 'get_public_checkout_info exists');
select is(has_function_privilege('anon', 'public.get_public_checkout_info(text)', 'execute'), true, 'anon can run get_public_checkout_info');
select is(has_function_privilege('authenticated', 'public.get_public_checkout_info(text)', 'execute'), true, 'authenticated can run get_public_checkout_info');

select isnt(current_setting('test.r_alpha'), 'NULL', 'an active shop is returned');
select is(current_setting('test.r_alpha')::jsonb ->> 'delivery_mode', 'paid_delivery', 'the delivery mode is returned');
select is(current_setting('test.r_alpha')::jsonb ->> 'delivery_fee_minor', '30000', 'the delivery fee is returned');
select is(current_setting('test.r_beta')::jsonb ->> 'delivery_mode', 'pickup_only', 'a pickup only shop says so');
select is(current_setting('test.r_beta')::jsonb ->> 'delivery_fee_minor', '0', 'a pickup only shop has no fee');

select is(current_setting('test.r_susp'), 'NULL', 'a suspended shop gives null');
select is(current_setting('test.r_unknown'), 'NULL', 'an unknown shop gives null');
select is(current_setting('test.r_inject'), 'NULL', 'an injection style link name gives null');
select is(current_setting('test.r_empty') || '/' || current_setting('test.r_long'), 'NULL/NULL', 'an empty and a very long link name give null');
select is(current_setting('test.r_alpha') ~ '(shop_id|created_by|is_listed|"id"|"status")', false, 'internal fields are never returned');

select is((select count(*)::int from jsonb_object_keys(current_setting('test.r_alpha')::jsonb)), 5, 'exactly five fields are returned');

select * from finish();

rollback;
