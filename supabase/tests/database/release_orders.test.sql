/*
  Chunk 29: tests that try to break release_expired_orders.
  Shops: alpha (attendant 3333), beta (owner 4444).
  Alpha has one expired unpaid order holding 2 items of variant c1, and one fresh unpaid order.
  Beta has one expired unpaid order with no items, which alpha's team must never touch.
*/

begin;

select plan(15);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bags', 'Bag', null, 90000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'One size', 'brown', true, null, now(), now());

insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, created_at) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', -2, 'sale', now());

insert into public.orders (id, shop_id, reference, status, buyer_name, buyer_phone, delivery_method, delivery_note, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at, created_at, updated_at) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-EXP001', 'awaiting_payment', 'Old Buyer', '254700000001', 'pickup', null, 'KES', 180000, 0, 180000, now() - interval '1 hour', now() - interval '25 hours', now() - interval '25 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-NEW001', 'awaiting_payment', 'New Buyer', '254700000002', 'pickup', null, 'KES', 0, 0, 0, now() + interval '5 hours', now(), now()),
  ('ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'SF-BET001', 'awaiting_payment', 'Beta Buyer', '254700000003', 'pickup', null, 'KES', 0, 0, 0, now() - interval '1 hour', now() - interval '25 hours', now() - interval '25 hours');

insert into public.order_items (order_id, shop_id, product_id, variant_id, product_name, variant_label, quantity, unit_price_minor, stock_movement_id) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Bag', 'One size / brown', 2, 90000, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2');

set local session_replication_role = origin;

/* An outsider, an unknown shop and a caller with no session all try the alpha team's function, then the attendant uses it twice */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
    perform set_config('test.o_out', 'ok', true);
  exception when others then
    perform set_config('test.o_out', sqlstate, true);
  end;
  begin
    perform public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9');
    perform set_config('test.o_unknown', 'ok', true);
  exception when others then
    perform set_config('test.o_unknown', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
    perform set_config('test.o_none', 'ok', true);
  exception when others then
    perform set_config('test.o_none', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  begin
    perform set_config('test.r_first', public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);
  exception when others then
    perform set_config('test.r_first', 'ERR ' || sqlstate, true);
  end;
  begin
    perform set_config('test.r_second', public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);
  exception when others then
    perform set_config('test.r_second', 'ERR ' || sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

/* Beta's order must still be untouched after everything alpha's side did */
do $$
begin
  perform set_config('test.beta_status', (select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff3'), true);
end;
$$;

/* The beta owner releases their own shop */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform set_config('test.r_beta', public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2')::text, true);
  exception when others then
    perform set_config('test.r_beta', 'ERR ' || sqlstate, true);
  end;
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop')), 2, 'fixture: two shops exist');
select has_function('public', 'release_expired_orders', array['uuid'], 'release_expired_orders exists');
select is(has_function_privilege('anon', 'public.release_expired_orders(uuid)', 'execute'), false, 'anon cannot run release_expired_orders');
select is(has_function_privilege('authenticated', 'public.release_expired_orders(uuid)', 'execute'), true, 'authenticated can run release_expired_orders');

select is(current_setting('test.o_out'), '42501', 'the owner of another shop is refused');
select is(current_setting('test.o_unknown'), '42501', 'an unknown shop gives the same refusal');
select is(current_setting('test.o_none'), '42501', 'a caller with no session is refused');

select is(current_setting('test.r_first'), '1', 'an attendant releases the one expired order');
select is(current_setting('test.r_second'), '0', 'a second call finds nothing to release');
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'), 'expired', 'the expired order is marked expired');
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff2'), 'awaiting_payment', 'the fresh order is left alone');
select is((select count(*)::int from public.stock_movements m where m.reverses_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'), 1, 'its stock came back through one reversal row');
select is((select coalesce(sum(m.quantity_change), 0)::int from public.stock_movements m where m.variant_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'), 5, 'the variant has its full stock again');

select is(current_setting('test.beta_status'), 'awaiting_payment', 'the other shop order was not touched by alpha team calls');
select is(current_setting('test.r_beta'), '1', 'the beta owner releases their own expired order');

select * from finish();

rollback;
