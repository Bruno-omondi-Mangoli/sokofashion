/*
  Chunk 27: tests that try to break the order core.
  Shops: alpha (paid delivery 300), beta (pickup only, has 3 unpaid orders from one phone),
  gamma (suspended), delta (free delivery), capshop (has 50 unpaid orders).
  People: 1111 owner of alpha, 2222 manager of alpha, 3333 attendant of alpha, 4444 owner of beta.
  Variants c1 to c8. c5 starts with an expired unpaid order holding 2 of its 3 items,
  so a successful order for 2 proves that expiry gives the stock back.
*/

begin;

select plan(67);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, delivery_mode, delivery_fee_minor, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', 'paid_delivery', 30000, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', 'pickup_only', 0, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'gammashop', 'Gamma Shop', 'KE', 'KES', 'en', 'suspended', 'pickup_only', 0, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'deltashop', 'Delta Shop', 'KE', 'KES', 'en', 'active', 'free_delivery', 0, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'capshop', 'Cap Shop', 'KE', 'KES', 'en', 'active', 'pickup_only', 0, now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'owner', true, now()),
  ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-4222-8222-222222222222', 'manager', true, now()),
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

insert into public.products (id, shop_id, category_code, name, description, price_minor, currency_code, status, created_at, updated_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Dress', null, 150000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'clothes', 'Draft dress', null, 150000, 'KES', 'draft', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bags', 'Bag', null, 90000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bags', 'Beta bag', null, 90000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'shoes', 'Gamma shoes', null, 120000, 'KES', 'active', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'shoes', 'Delta shoes', null, 100000, 'KES', 'active', now(), now());

insert into public.product_variants (id, shop_id, product_id, size, colour, is_active, price_minor, created_at, updated_at) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'S', 'red', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'M', 'red', true, 160000, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'L', 'red', false, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'M', 'blue', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'One size', 'brown', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'One size', 'black', true, null, now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'One size', 'black', true, null, now(), now());

insert into public.stock_movements (id, shop_id, variant_id, quantity_change, reason, created_at) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 1, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 3, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8', 5, 'opening', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee9', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', -2, 'sale', now());

/* An unpaid order whose time ran out one hour ago, holding 2 of the 3 items of variant c5 */
insert into public.orders (id, shop_id, reference, status, buyer_name, buyer_phone, delivery_method, delivery_note, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at, created_at, updated_at) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-OLD111', 'awaiting_payment', 'Old Buyer', '254700000001', 'pickup', null, 'KES', 180000, 0, 180000, now() - interval '1 hour', now() - interval '25 hours', now() - interval '25 hours');

insert into public.order_items (order_id, shop_id, product_id, variant_id, product_name, variant_label, quantity, unit_price_minor, stock_movement_id) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'Bag', 'One size / brown', 2, 90000, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee9');

/* Three unpaid orders from one phone in beta */
insert into public.orders (shop_id, reference, buyer_name, buyer_phone, delivery_method, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'SF-PHN00' || n, 'Fixture Buyer', '254799999999', 'pickup'::public.delivery_method, 'KES', 0, 0, 0, now() + interval '5 hours'
from generate_series(1, 3) as n;

/* Fifty unpaid orders from fifty phones in capshop */
insert into public.orders (shop_id, reference, buyer_name, buyer_phone, delivery_method, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'SF-CAP' || lpad(n::text, 3, '0'), 'Fixture Buyer', '2547' || lpad((100 + n)::text, 8, '0'), 'pickup'::public.delivery_method, 'KES', 0, 0, 0, now() + interval '5 hours'
from generate_series(1, 50) as n;

set local session_replication_role = origin;

/* Buyers who are not signed in place orders and try to break the rules */
set local role anon;

do $$
declare
  bad_count integer := 0;
  c record;
begin
  begin
    perform set_config('test.r_ok', public.place_order('alphashop', 'Wanjiku Test', '0712 345 678', 'delivery', 'Kilimani, gate B',
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":2},{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc5","quantity":2}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_ok', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_pickup', public.place_order('alphashop', 'Pickup Buyer', '0722000001', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_pickup', 'ERR ' || sqlstate, true);
  end;

  /* A forged price inside the request must be ignored */
  begin
    perform set_config('test.r_forged', public.place_order('alphashop', 'Forger Buyer', '0722000002', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1,"price_minor":1,"unit_price_minor":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_forged', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_free', public.place_order('deltashop', 'Free Buyer', '0722000003', 'delivery', 'Westlands, ABC Place',
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc8","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_free', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_other', public.place_order('betashop', 'Beta Buyer', '0722000004', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc6","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_other', 'ERR ' || sqlstate, true);
  end;

  /* The last item of variant c2: the first buyer gets it, the second does not */
  begin
    perform set_config('test.r_last_a', public.place_order('alphashop', 'Last Buyer A', '0722000005', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc2","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_last_a', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_last_b', public.place_order('alphashop', 'Last Buyer B', '0722000006', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc2","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_last_b', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_toomany', public.place_order('alphashop', 'Greedy Buyer', '0722000007', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":10}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_toomany', 'ERR ' || sqlstate, true);
  end;

  /* One good line and one line without enough stock: nothing may be taken */
  begin
    perform set_config('test.r_atomic', public.place_order('alphashop', 'Atomic Buyer', '0722000008', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc5","quantity":1},{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc2","quantity":5}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_atomic', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_draft', public.place_order('alphashop', 'Draft Buyer', '0722000009', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc4","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_draft', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_inactive', public.place_order('alphashop', 'Inactive Buyer', '0722000010', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc3","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_inactive', 'ERR ' || sqlstate, true);
  end;

  /* A variant of another shop asked through alpha */
  begin
    perform set_config('test.r_wrong', public.place_order('alphashop', 'Wrong Buyer', '0722000011', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc6","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_wrong', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_susp', public.place_order('gammashop', 'Susp Buyer', '0722000012', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc7","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_susp', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_unknown', public.place_order('no-such-shop', 'Unknown Buyer', '0722000013', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_unknown', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_nodel', public.place_order('betashop', 'Deliver Buyer', '0722000014', 'delivery', 'Nairobi, Kileleshwa',
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc6","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_nodel', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_phonecap', public.place_order('betashop', 'Cap Buyer', '0799999999', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc6","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_phonecap', 'ERR ' || sqlstate, true);
  end;

  begin
    perform set_config('test.r_shopcap', public.place_order('capshop', 'Shop Cap Buyer', '0722000015', 'pickup', null,
      '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'::jsonb)::text, true);
  exception when others then
    perform set_config('test.r_shopcap', 'ERR ' || sqlstate, true);
  end;

  /* Ten kinds of bad input. Every one must be refused with 22023. */
  for c in
    select * from (values
      ('Test Buyer', '12345', 'pickup', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'),
      ('A', '0722111111', 'pickup', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'),
      ('Test Buyer', '0722111112', 'delivery', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'),
      ('Test Buyer', '0722111113', 'courier', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1}]'),
      ('Test Buyer', '0722111114', 'pickup', null, '[]'),
      ('Test Buyer', '0722111115', 'pickup', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":11}]'),
      ('Test Buyer', '0722111116', 'pickup', null, '[{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":1},{"variant_id":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","quantity":2}]'),
      ('Test Buyer', '0722111117', 'pickup', null, '[{"variant_id":"not-a-uuid","quantity":1}]'),
      ('Test Buyer', '0722111118', 'pickup', null, (select jsonb_agg(jsonb_build_object('variant_id', gen_random_uuid()::text, 'quantity', 1))::text from generate_series(1, 21))),
      ('Test Buyer', '0722111119', 'pickup', null, '{"a":1}')
    ) as t(buyer, phone, choice, note, items)
  loop
    begin
      perform public.place_order('alphashop', c.buyer, c.phone, c.choice, c.note, c.items::jsonb);
    exception when others then
      if sqlstate = '22023' then
        bad_count := bad_count + 1;
      end if;
    end;
  end loop;
  perform set_config('test.bad_count', bad_count::text, true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.pickup_id', (select o.id::text from public.orders o where o.reference = (current_setting('test.r_pickup')::jsonb ->> 'reference')), true);
end;
$$;

/* Staff and an outsider try to cancel orders and change delivery settings, and read orders */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  begin
    perform public.cancel_order(current_setting('test.pickup_id')::uuid);
    perform set_config('test.c_att', 'ok', true);
  exception when others then
    perform set_config('test.c_att', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.cancel_order(current_setting('test.pickup_id')::uuid);
    perform set_config('test.c_out', 'ok', true);
  exception when others then
    perform set_config('test.c_out', sqlstate, true);
  end;
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'free_delivery', 0);
    perform set_config('test.d_out', 'ok', true);
  exception when others then
    perform set_config('test.d_out', sqlstate, true);
  end;
  perform set_config('test.n_beta_alpha_orders', (select count(*) from public.orders o where o.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);
  perform set_config('test.n_beta_own_orders', (select count(*) from public.orders o where o.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2')::text, true);
  perform set_config('test.n_beta_alpha_items', (select count(*) from public.order_items i where i.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);

  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  begin
    perform public.cancel_order('ffffffff-ffff-4fff-8fff-ffffffffff99');
    perform set_config('test.c_unknown', 'ok', true);
  exception when others then
    perform set_config('test.c_unknown', sqlstate, true);
  end;
  begin
    perform public.cancel_order(current_setting('test.pickup_id')::uuid);
    perform set_config('test.c_mgr', 'ok', true);
  exception when others then
    perform set_config('test.c_mgr', sqlstate, true);
  end;
  begin
    perform public.cancel_order(current_setting('test.pickup_id')::uuid);
    perform set_config('test.c_again', 'ok', true);
  exception when others then
    perform set_config('test.c_again', sqlstate, true);
  end;
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'free_delivery', 0);
    perform set_config('test.d_mgr', 'ok', true);
  exception when others then
    perform set_config('test.d_mgr', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'paid_delivery', 0);
    perform set_config('test.d_zero', 'ok', true);
  exception when others then
    perform set_config('test.d_zero', sqlstate, true);
  end;
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'pickup_only', 500);
    perform set_config('test.d_pickfee', 'ok', true);
  exception when others then
    perform set_config('test.d_pickfee', sqlstate, true);
  end;
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'paid_delivery', 100000001);
    perform set_config('test.d_max', 'ok', true);
  exception when others then
    perform set_config('test.d_max', sqlstate, true);
  end;
  begin
    perform public.set_shop_delivery('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'paid_delivery', 25000);
    perform set_config('test.d_ok', 'ok', true);
  exception when others then
    perform set_config('test.d_ok', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  perform set_config('test.n_att_orders', (select count(*) from public.orders o where o.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);
  perform set_config('test.n_att_items', (select count(*) from public.order_items i where i.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1')::text, true);

  perform set_config('request.jwt.claims', '', true);
  perform set_config('test.n_nosession', (select count(*) from public.orders)::text, true);
end;
$$;

reset role;

/* Fixture proof */
select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop', 'gammashop', 'deltashop', 'capshop')), 5, 'fixture: five shops exist');
select is((select count(*)::int from public.product_variants where id::text like 'cccccccc-cccc-4ccc-8ccc-ccccccccccc%'), 8, 'fixture: eight variants exist');

/* Permissions */
select has_function('public', 'place_order', array['text', 'text', 'text', 'text', 'text', 'jsonb'], 'place_order exists');
select is(has_function_privilege('anon', 'public.place_order(text, text, text, text, text, jsonb)', 'execute'), true, 'anon can run place_order');
select is(has_function_privilege('anon', 'public.cancel_order(uuid)', 'execute'), false, 'anon cannot run cancel_order');
select is(has_function_privilege('anon', 'public.set_shop_delivery(uuid, public.shop_delivery_mode, integer)', 'execute'), false, 'anon cannot run set_shop_delivery');
select is(has_function_privilege('authenticated', 'public.cancel_order(uuid)', 'execute'), true, 'authenticated can run cancel_order');
select is(has_function_privilege('authenticated', 'public.set_shop_delivery(uuid, public.shop_delivery_mode, integer)', 'execute'), true, 'authenticated can run set_shop_delivery');
select is(has_function_privilege('anon', 'public.release_order_stock(uuid)', 'execute') or has_function_privilege('authenticated', 'public.release_order_stock(uuid)', 'execute'), false, 'nobody can run release_order_stock directly');
select is(has_function_privilege('anon', 'public.expire_stale_orders_for_shop(uuid)', 'execute') or has_function_privilege('authenticated', 'public.expire_stale_orders_for_shop(uuid)', 'execute'), false, 'nobody can run expire_stale_orders_for_shop directly');
select is(has_table_privilege('anon', 'public.orders', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), false, 'anon has no permission on orders');
select is(has_table_privilege('authenticated', 'public.orders', 'INSERT,UPDATE,DELETE,TRUNCATE'), false, 'authenticated cannot write orders directly');
select is(has_table_privilege('authenticated', 'public.orders', 'SELECT'), true, 'authenticated can read orders through row security');
select is(has_table_privilege('anon', 'public.order_items', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), false, 'anon has no permission on order_items');
select is(has_table_privilege('authenticated', 'public.order_items', 'INSERT,UPDATE,DELETE,TRUNCATE'), false, 'authenticated cannot write order_items directly');
select is((select relrowsecurity from pg_class where oid = 'public.orders'::regclass), true, 'row security is on for orders');
select is((select relrowsecurity from pg_class where oid = 'public.order_items'::regclass), true, 'row security is on for order_items');

/* Placing orders */
select isnt(substr(current_setting('test.r_ok'), 1, 3), 'ERR', 'a good order is accepted');
select is((current_setting('test.r_ok')::jsonb ->> 'reference') ~ '^SF-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$', true, 'the order reference has the expected shape');
select is(current_setting('test.r_ok')::jsonb ->> 'subtotal_minor', '480000', 'the subtotal comes from database prices');
select is(current_setting('test.r_ok')::jsonb ->> 'delivery_fee_minor', '30000', 'the delivery fee comes from the shop setting');
select is(current_setting('test.r_ok')::jsonb ->> 'total_minor', '510000', 'the total is subtotal plus delivery fee');
select is(current_setting('test.r_ok')::jsonb ->> 'status', 'awaiting_payment', 'a new order waits for payment');
select is((select o.buyer_phone from public.orders o where o.reference = (current_setting('test.r_ok')::jsonb ->> 'reference')), '254712345678', 'the phone number is stored in one standard form');
select is((select count(*)::int from public.order_items i join public.orders o on o.id = i.order_id where o.reference = (current_setting('test.r_ok')::jsonb ->> 'reference')), 2, 'both items are stored with the order');
select is((current_setting('test.r_pickup')::jsonb ->> 'delivery_fee_minor') || '/' || (current_setting('test.r_pickup')::jsonb ->> 'total_minor'), '0/150000', 'pickup has no delivery fee');
select is((select i.unit_price_minor::text from public.order_items i join public.orders o on o.id = i.order_id where o.reference = (current_setting('test.r_forged')::jsonb ->> 'reference') and i.variant_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'), '150000', 'a forged price in the request is ignored');
select is((current_setting('test.r_free')::jsonb ->> 'delivery_fee_minor') || '/' || (current_setting('test.r_free')::jsonb ->> 'total_minor'), '0/100000', 'free delivery adds nothing');
select isnt(substr(current_setting('test.r_other'), 1, 3), 'ERR', 'another phone can still order from a shop');
select isnt(substr(current_setting('test.r_last_a'), 1, 3), 'ERR', 'the first buyer gets the last item');
select is(current_setting('test.r_last_b'), 'ERR SF001', 'the second buyer cannot take the last item');
select is(current_setting('test.r_toomany'), 'ERR SF001', 'ordering more than the stock is refused');
select is(current_setting('test.r_atomic'), 'ERR SF001', 'an order with one short line is refused as a whole');
select is(current_setting('test.r_draft'), 'ERR SF002', 'a draft product cannot be ordered');
select is(current_setting('test.r_inactive'), 'ERR SF002', 'an inactive variant cannot be ordered');
select is(current_setting('test.r_wrong'), 'ERR SF002', 'a variant of another shop cannot be ordered');
select is(current_setting('test.r_susp'), 'ERR SF003', 'a suspended shop cannot take orders');
select is(current_setting('test.r_unknown'), 'ERR SF003', 'an unknown shop gives the same refusal');
select is(current_setting('test.r_nodel'), 'ERR SF006', 'a pickup only shop refuses delivery');
select is(current_setting('test.r_phonecap'), 'ERR SF005', 'a phone number cannot hold more than 3 unpaid orders');
select is(current_setting('test.r_shopcap'), 'ERR SF004', 'a shop cannot hold more than 50 unpaid orders');
select is(current_setting('test.bad_count'), '10', 'all ten kinds of bad input are refused with 22023');

/* Expiry and stock */
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'), 'expired', 'the old unpaid order expired');
select is((select count(*)::int from public.stock_movements m where m.reverses_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee9'), 1, 'its stock was given back by one reversal row');
select is((select coalesce(sum(m.quantity_change), 0)::int from public.stock_movements m where m.variant_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'), 2, 'variant c1 stock is right after orders and a cancel');
select is((select coalesce(sum(m.quantity_change), 0)::int from public.stock_movements m where m.variant_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'), 1, 'variant c5 stock is right after expiry and an order');
select is((select coalesce(sum(m.quantity_change), 0)::int from public.stock_movements m where m.variant_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'), 0, 'the last item is gone and stock is not negative');
select is((select count(*)::int from public.variant_stock v where v.on_hand < 0), 0, 'no variant has negative stock');

/* Cancelling */
select is(current_setting('test.c_att'), '42501', 'an attendant cannot cancel an order');
select is(current_setting('test.c_out'), '42501', 'the owner of another shop cannot cancel an order');
select is(current_setting('test.c_unknown'), '42501', 'an unknown order gives the same refusal');
select is(current_setting('test.c_mgr'), 'ok', 'a manager can cancel an unpaid order');
select is((select o.status::text from public.orders o where o.id = current_setting('test.pickup_id')::uuid), 'cancelled', 'the cancelled order is marked cancelled');
select is(current_setting('test.c_again'), '22023', 'a cancelled order cannot be cancelled again');

/* Delivery settings */
select is(current_setting('test.d_mgr'), '42501', 'a manager cannot change delivery settings');
select is(current_setting('test.d_out'), '42501', 'the owner of another shop cannot change delivery settings');
select is(current_setting('test.d_zero'), '22023', 'paid delivery needs a fee');
select is(current_setting('test.d_pickfee'), '22023', 'pickup only cannot have a fee');
select is(current_setting('test.d_max'), '22023', 'a fee above the maximum is refused');
select is(current_setting('test.d_ok'), 'ok', 'the owner can set a delivery fee');
select is((select s.delivery_fee_minor::text from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), '25000', 'the new delivery fee is stored');

/* Who can read orders */
select isnt(current_setting('test.n_att_orders'), '0', 'an attendant sees the orders of their shop');
select is(current_setting('test.n_beta_alpha_orders'), '0', 'the owner of another shop sees none of them');
select isnt(current_setting('test.n_beta_own_orders'), '0', 'the owner of beta sees their own orders');
select isnt(current_setting('test.n_att_items'), '0', 'an attendant sees the order items of their shop');
select is(current_setting('test.n_beta_alpha_items'), '0', 'the owner of another shop sees none of the items');
select is(current_setting('test.n_nosession'), '0', 'a signed in user without a session sees no orders');

select * from finish();

rollback;
