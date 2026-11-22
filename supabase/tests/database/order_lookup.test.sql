/*
  Chunk 31: tests that try to break lookup_order.
  One shop (alpha). Orders: ABC234 (unpaid, still valid, phone 0712 345 678, one item),
  EXP234 (unpaid but past its time), PAD234 (paid), LCK234 (used for the lockout).
  Each wrong guess is wrong for exactly one reason.
*/

begin;

select plan(28);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', now(), now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Dress', null, 150000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'M', 'red', true, null, now(), now());

insert into public.orders (id, shop_id, reference, status, buyer_name, buyer_phone, delivery_method, delivery_note, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-ABC234', 'awaiting_payment', 'Wanjiku Test', '254712345678', 'pickup', null, 'KES', 150000, 0, 150000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-EXP234', 'awaiting_payment', 'Expired Buyer', '254722222222', 'pickup', null, 'KES', 150000, 0, 150000, now() - interval '1 hour'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-PAD234', 'paid', 'Paid Buyer', '254733333333', 'pickup', null, 'KES', 150000, 0, 150000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-JCK234', 'awaiting_payment', 'Lock Buyer', '254744444444', 'pickup', null, 'KES', 150000, 0, 150000, now() + interval '5 hours');

insert into public.order_items (order_id, shop_id, product_id, variant_id, product_name, variant_label, quantity, unit_price_minor) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Dress', 'M / red', 1, 150000);

set local session_replication_role = origin;

set local role anon;

do $$
begin
  perform set_config('test.r_ok', coalesce(public.lookup_order('SF-ABC234', '0712 345 678')::text, 'NULL'), true);
  perform set_config('test.r_fmt', coalesce(public.lookup_order(' sf-abc234 ', '+254 712-345-678')::text, 'NULL'), true);
  perform set_config('test.r_wrongphone', coalesce(public.lookup_order('SF-ABC234', '0700000000')::text, 'NULL'), true);
  perform set_config('test.r_unknownref', coalesce(public.lookup_order('SF-ZZZ999', '0712345678')::text, 'NULL'), true);
  perform set_config('test.r_cross', coalesce(public.lookup_order('SF-ABC234', '0733333333')::text, 'NULL'), true);
  perform set_config('test.r_badref', coalesce(public.lookup_order('hello', '0712345678')::text, 'NULL'), true);
  perform set_config('test.r_badphone', coalesce(public.lookup_order('SF-ABC234', '123')::text, 'NULL'), true);
  perform set_config('test.r_inject', coalesce(public.lookup_order('SF-ABC234'' or ''1''=''1', '0712345678')::text, 'NULL'), true);
  perform set_config('test.r_null', coalesce(public.lookup_order(null, null)::text, 'NULL'), true);
  perform set_config('test.r_expired', coalesce(public.lookup_order('SF-EXP234', '0722222222')::text, 'NULL'), true);
  perform set_config('test.r_paid', coalesce(public.lookup_order('SF-PAD234', '0733333333')::text, 'NULL'), true);

  /* A correct lookup works first, then ten wrong guesses lock the phone, then even the correct one is refused */
  perform set_config('test.r_lock_ok', coalesce(public.lookup_order('SF-JCK234', '0744444444')::text, 'NULL'), true);
  for n in 1..10 loop
    perform public.lookup_order('SF-AAAAA' || substr('23456789BC', n, 1), '0744444444');
  end loop;
  perform set_config('test.r_locked', coalesce(public.lookup_order('SF-JCK234', '0744444444')::text, 'NULL'), true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.n744', (select count(*) from public.order_lookup_attempts where phone = '254744444444')::text, true);
end;
$$;

/* Five thousand failures in the last hour switch off logging, but real lookups keep working */
insert into public.order_lookup_attempts (phone)
select '2547' || lpad(n::text, 8, '0') from generate_series(1, 5000) as n;

set local role anon;

do $$
begin
  perform set_config('test.r_flood_miss', coalesce(public.lookup_order('SF-AAAAA2', '0755555555')::text, 'NULL'), true);
  perform set_config('test.r_flood_ok', coalesce(public.lookup_order('SF-ABC234', '0712345678')::text, 'NULL'), true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.n755', (select count(*) from public.order_lookup_attempts where phone = '254755555555')::text, true);
end;
$$;

select is((select count(*)::int from public.orders where reference in ('SF-ABC234', 'SF-EXP234', 'SF-PAD234', 'SF-JCK234')), 4, 'fixture: four orders exist');

select has_function('public', 'lookup_order', array['text', 'text'], 'lookup_order exists');
select is(has_function_privilege('anon', 'public.lookup_order(text, text)', 'execute'), true, 'anon can run lookup_order');
select is(has_function_privilege('authenticated', 'public.lookup_order(text, text)', 'execute'), true, 'authenticated can run lookup_order');
select is(has_table_privilege('anon', 'public.order_lookup_attempts', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), false, 'anon has no permission on the attempts table');
select is(has_table_privilege('authenticated', 'public.order_lookup_attempts', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), false, 'authenticated has no permission on the attempts table');
select is((select relrowsecurity from pg_class where oid = 'public.order_lookup_attempts'::regclass), true, 'row security is on for the attempts table');

select isnt(current_setting('test.r_ok'), 'NULL', 'the right reference and phone give the order');
select is(current_setting('test.r_ok')::jsonb ->> 'reference', 'SF-ABC234', 'the reference is returned');
select is(current_setting('test.r_ok')::jsonb ->> 'status', 'awaiting_payment', 'the status is returned');
select is(current_setting('test.r_ok')::jsonb ->> 'total_minor', '150000', 'the total is returned');
select is(jsonb_array_length(current_setting('test.r_ok')::jsonb -> 'items'), 1, 'the item is returned');
select is(current_setting('test.r_ok')::jsonb #>> '{items,0,product_name}', 'Dress', 'the item name is returned');
select is(current_setting('test.r_ok')::jsonb #>> '{shop,name}', 'Alpha Shop', 'the shop name is returned');
select is(current_setting('test.r_ok') ~ '(buyer_phone|buyer_name|shop_id|254712345678|Wanjiku)', false, 'the phone, the buyer name and internal ids are never returned');
select isnt(current_setting('test.r_fmt'), 'NULL', 'lower case, spaces and a plus sign are accepted');

select is(current_setting('test.r_wrongphone'), 'NULL', 'a right reference with a wrong phone gives null');
select is(current_setting('test.r_unknownref'), 'NULL', 'an unknown reference gives null');
select is(current_setting('test.r_cross'), 'NULL', 'another buyer phone cannot read the order');
select is(current_setting('test.r_badref') || '/' || current_setting('test.r_badphone') || '/' || current_setting('test.r_inject') || '/' || current_setting('test.r_null'), 'NULL/NULL/NULL/NULL', 'malformed input gives null');

select is(current_setting('test.r_expired')::jsonb ->> 'status', 'expired', 'an unpaid order past its time shows as expired');
select is(current_setting('test.r_paid')::jsonb ->> 'status', 'paid', 'a paid order shows as paid');

select isnt(current_setting('test.r_lock_ok'), 'NULL', 'a correct lookup works before any failures');
select is(current_setting('test.r_locked'), 'NULL', 'after ten failures even the correct lookup is refused');
select is(current_setting('test.n744'), '10', 'a refused lookup is not logged again');

select is(current_setting('test.r_flood_miss'), 'NULL', 'a wrong guess still gives null when the log is full');
select is(current_setting('test.n755'), '0', 'the log stops growing once 5000 failures are stored');
select isnt(current_setting('test.r_flood_ok'), 'NULL', 'a correct lookup still works when the log is full');

select * from finish();

rollback;
