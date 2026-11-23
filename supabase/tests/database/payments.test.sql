/*
  Chunk 33: tests that try to break the payment functions.
  Shops: alpha (1111 owner, 3333 attendant), beta (4444 owner).
  Alpha orders: O1 ABC234 150000 (the happy path), O2 BCD234 90000 (rejected later),
  O3 CDE234 (has three rejected payments), O4 DEF234 (past its time), O5 EFG234 (paid),
  O7 GHJ234 (cancelled), O8 HJK234 (past its time, fresh pending code),
  O9 JKM234 (past its time, three day old pending code), O10 KMN234 (lockout).
  Beta order: O6 FGH234.
*/

begin;

select plan(63);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'owner', true, now()),
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

insert into public.orders (id, shop_id, reference, status, buyer_name, buyer_phone, delivery_method, delivery_note, currency_code, subtotal_minor, delivery_fee_minor, total_minor, expires_at) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-ABC234', 'awaiting_payment', 'Buyer One', '254712345678', 'pickup', null, 'KES', 150000, 0, 150000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-BCD234', 'awaiting_payment', 'Buyer Two', '254722222222', 'pickup', null, 'KES', 90000, 0, 90000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-CDE234', 'awaiting_payment', 'Buyer Three', '254733333333', 'pickup', null, 'KES', 50000, 0, 50000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff4', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-DEF234', 'awaiting_payment', 'Buyer Four', '254744444444', 'pickup', null, 'KES', 100000, 0, 100000, now() - interval '1 hour'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-EFG234', 'paid', 'Buyer Five', '254755555555', 'pickup', null, 'KES', 80000, 0, 80000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff6', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'SF-FGH234', 'awaiting_payment', 'Buyer Six', '254766666666', 'pickup', null, 'KES', 70000, 0, 70000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-GHJ234', 'awaiting_payment', 'Buyer Seven', '254777777777', 'pickup', null, 'KES', 60000, 0, 60000, now() + interval '5 hours'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-HJK234', 'awaiting_payment', 'Buyer Eight', '254711111118', 'pickup', null, 'KES', 40000, 0, 40000, now() - interval '1 hour'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff9', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-JKM234', 'awaiting_payment', 'Buyer Nine', '254711111119', 'pickup', null, 'KES', 90000, 0, 90000, now() - interval '1 hour'),
  ('ffffffff-ffff-4fff-8fff-fffffffffffa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'SF-KMN234', 'awaiting_payment', 'Buyer Ten', '254788888888', 'pickup', null, 'KES', 30000, 0, 30000, now() + interval '5 hours');

insert into public.payments (id, order_id, shop_id, mpesa_code, status, amount_minor, submitted_at, decided_at) values
  ('55555555-5555-4555-8555-555555555551', 'ffffffff-ffff-4fff-8fff-fffffffffff5', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'ABCDE12345', 'confirmed', 80000, now(), now()),
  ('55555555-5555-4555-8555-555555555552', 'ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'REJECTED01', 'rejected', null, now(), now()),
  ('55555555-5555-4555-8555-555555555553', 'ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'REJECTED02', 'rejected', null, now(), now()),
  ('55555555-5555-4555-8555-555555555554', 'ffffffff-ffff-4fff-8fff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'REJECTED03', 'rejected', null, now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'ffffffff-ffff-4fff-8fff-fffffffffff7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'FIXTURE007', 'pending', null, now(), null),
  ('55555555-5555-4555-8555-555555555556', 'ffffffff-ffff-4fff-8fff-fffffffffff8', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'FIXTURE008', 'pending', null, now(), null),
  ('55555555-5555-4555-8555-555555555557', 'ffffffff-ffff-4fff-8fff-fffffffffff9', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'FIXTURE009', 'pending', null, now() - interval '3 days', null);

set local session_replication_role = origin;

/* Buyers who are not signed in submit codes and try to break the rules */
set local role anon;

do $$
declare
  c record;
begin
  for c in
    select * from (values
      (1, 's_ok', 'SF-ABC234', '0712 345 678', ' sga4x9k2pq '),
      (2, 's_dup_pending', 'SF-BCD234', '0722222222', 'SGA4X9K2PQ'),
      (3, 's_dup_confirmed', 'SF-BCD234', '0722222222', 'ABCDE12345'),
      (4, 's_released', 'SF-BCD234', '0722222222', 'REJECTED01'),
      (5, 's_second_pending', 'SF-ABC234', '0712345678', 'NEWCODE001'),
      (6, 's_short', 'SF-CDE234', '0733333333', 'SHORT'),
      (7, 's_chars', 'SF-CDE234', '0733333333', 'ABC DE1234'),
      (8, 's_badref', 'hello', '0733333333', 'ABCDE67890'),
      (9, 's_badphone', 'SF-CDE234', '123', 'ABCDE67890'),
      (10, 's_wrongphone', 'SF-CDE234', '0700000000', 'ABCDE67890'),
      (11, 's_unknownref', 'SF-ZZZ999', '0733333333', 'ABCDE67890'),
      (12, 's_cross', 'SF-FGH234', '0733333333', 'ABCDE67890'),
      (13, 's_expired', 'SF-DEF234', '0744444444', 'EXPIRED001'),
      (14, 's_paidorder', 'SF-EFG234', '0755555555', 'PAIDORD001'),
      (15, 's_cap', 'SF-CDE234', '0733333333', 'FOURTHCODE')
    ) as t(n, k, ref, phone, code)
    order by n
  loop
    begin
      perform set_config('test.' || c.k, coalesce(public.submit_payment(c.ref, c.phone, c.code)::text, 'NULL'), true);
    exception when others then
      perform set_config('test.' || c.k, sqlstate, true);
    end;
  end loop;

  perform set_config('test.l_pending', coalesce(public.lookup_order('SF-ABC234', '0712345678')::text, 'NULL'), true);
  perform set_config('test.l_rejected', coalesce(public.lookup_order('SF-CDE234', '0733333333')::text, 'NULL'), true);
  perform set_config('test.l_none', coalesce(public.lookup_order('SF-FGH234', '0766666666')::text, 'NULL'), true);

  /* Ten wrong guesses lock the phone, then even the right reference with a good code is refused */
  for n in 1..10 loop
    perform public.submit_payment('SF-AAAAA' || substr('23456789BC', n, 1), '0788888888', 'LOCKCODE01');
  end loop;
  perform set_config('test.s_locked', coalesce(public.submit_payment('SF-KMN234', '0788888888', 'LOCKCODE01')::text, 'NULL'), true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.pay_o1', (select p.id::text from public.payments p where p.mpesa_code = 'SGA4X9K2PQ'), true);
  perform set_config('test.pay_o2', (select p.id::text from public.payments p where p.mpesa_code = 'REJECTED01' and p.status = 'pending'), true);
  perform set_config('test.stored_o1', (select count(*)::text from public.payments p where p.mpesa_code = 'SGA4X9K2PQ' and p.status = 'pending' and p.order_id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'), true);
  perform set_config('test.n788', (select count(*)::text from public.order_lookup_attempts a where a.phone = '254788888888'), true);
  perform set_config('test.n_o10', (select count(*)::text from public.payments p where p.order_id = 'ffffffff-ffff-4fff-8fff-fffffffffffa'), true);
end;
$$;

/* Staff and an outsider confirm, reject and cancel */
set local role authenticated;

do $$
declare
  o1 uuid := current_setting('test.pay_o1')::uuid;
  o2 uuid := current_setting('test.pay_o2')::uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.confirm_payment(o1, 150000);
    perform set_config('test.c_out', 'ok', true);
  exception when others then
    perform set_config('test.c_out', sqlstate, true);
  end;
  begin
    perform public.reject_payment(o2);
    perform set_config('test.r_out', 'ok', true);
  exception when others then
    perform set_config('test.r_out', sqlstate, true);
  end;
  begin
    perform public.confirm_payment('55555555-5555-4555-8555-5555555555ff', 150000);
    perform set_config('test.c_unknown', 'ok', true);
  exception when others then
    perform set_config('test.c_unknown', sqlstate, true);
  end;
  perform set_config('test.n_beta_alpha', (select count(*)::text from public.payments p where p.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);

  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.confirm_payment(o1, 150000);
    perform set_config('test.c_none', 'ok', true);
  exception when others then
    perform set_config('test.c_none', sqlstate, true);
  end;
  perform set_config('test.n_none', (select count(*)::text from public.payments), true);

  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  perform set_config('test.n_att', (select count(*)::text from public.payments p where p.shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), true);
  begin
    perform public.confirm_payment(o1, null);
    perform set_config('test.c_null', 'ok', true);
  exception when others then
    perform set_config('test.c_null', sqlstate, true);
  end;
  begin
    perform public.confirm_payment(o1, 149999);
    perform set_config('test.c_wrong', 'ok', true);
  exception when others then
    perform set_config('test.c_wrong', sqlstate, true);
  end;
  perform set_config('test.o1_after_wrong',
    (select o.status::text from public.orders o where o.reference = 'SF-ABC234') || '/' ||
    (select p.status::text from public.payments p where p.id = o1), true);

  begin
    perform public.confirm_payment(o1, 150000);
    perform set_config('test.c_ok', 'ok', true);
  exception when others then
    perform set_config('test.c_ok', sqlstate, true);
  end;
  perform set_config('test.o1_after_ok',
    (select o.status::text from public.orders o where o.reference = 'SF-ABC234') || '/' ||
    (select p.status::text from public.payments p where p.id = o1), true);
  perform set_config('test.decided_by', (select p.decided_by::text from public.payments p where p.id = o1), true);
  perform set_config('test.amount', (select p.amount_minor::text from public.payments p where p.id = o1), true);
  begin
    perform public.confirm_payment(o1, 150000);
    perform set_config('test.c_again', 'ok', true);
  exception when others then
    perform set_config('test.c_again', sqlstate, true);
  end;

  begin
    perform public.reject_payment(o2);
    perform set_config('test.r_ok', 'ok', true);
  exception when others then
    perform set_config('test.r_ok', sqlstate, true);
  end;
  perform set_config('test.o2_after', (select p.status::text from public.payments p where p.id = o2), true);
  begin
    perform public.reject_payment(o2);
    perform set_config('test.r_again', 'ok', true);
  exception when others then
    perform set_config('test.r_again', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.cancel_order('ffffffff-ffff-4fff-8fff-fffffffffff7');
    perform set_config('test.cancel', 'ok', true);
  exception when others then
    perform set_config('test.cancel', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  perform public.release_expired_orders('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
  begin
    perform public.confirm_payment('55555555-5555-4555-8555-555555555557', 90000);
    perform set_config('test.c_stale', 'ok', true);
  exception when others then
    perform set_config('test.c_stale', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

set local role anon;

do $$
begin
  perform set_config('test.l_paid', coalesce(public.lookup_order('SF-ABC234', '0712345678')::text, 'NULL'), true);
end;
$$;

reset role;

select is((select count(*)::int from public.orders where reference in ('SF-ABC234', 'SF-BCD234', 'SF-CDE234', 'SF-DEF234', 'SF-EFG234', 'SF-FGH234', 'SF-GHJ234', 'SF-HJK234', 'SF-JKM234', 'SF-KMN234')), 10, 'fixture: ten orders exist');

select has_function('public', 'submit_payment', array['text', 'text', 'text'], 'submit_payment exists');
select has_function('public', 'confirm_payment', array['uuid', 'bigint'], 'confirm_payment exists');
select has_function('public', 'reject_payment', array['uuid'], 'reject_payment exists');
select is(has_function_privilege('anon', 'public.submit_payment(text, text, text)', 'execute'), true, 'anon can run submit_payment');
select is(has_function_privilege('anon', 'public.confirm_payment(uuid, bigint)', 'execute'), false, 'anon cannot run confirm_payment');
select is(has_function_privilege('anon', 'public.reject_payment(uuid)', 'execute'), false, 'anon cannot run reject_payment');
select is(has_function_privilege('authenticated', 'public.confirm_payment(uuid, bigint)', 'execute'), true, 'authenticated can run confirm_payment');
select is(has_function_privilege('authenticated', 'public.reject_payment(uuid)', 'execute'), true, 'authenticated can run reject_payment');
select is(has_table_privilege('anon', 'public.payments', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), false, 'anon has no permission on payments');
select is(has_table_privilege('authenticated', 'public.payments', 'INSERT,UPDATE,DELETE,TRUNCATE'), false, 'authenticated cannot write payments directly');
select is(has_table_privilege('authenticated', 'public.payments', 'SELECT'), true, 'authenticated can read payments through row security');
select is((select relrowsecurity from pg_class where oid = 'public.payments'::regclass), true, 'row security is on for payments');
select is((select count(*)::int from pg_indexes where schemaname = 'public' and indexname = 'payments_active_code_idx'), 1, 'the unique code index exists');

select is(current_setting('test.s_ok') ~ '"status": "pending"', true, 'a good code is accepted and waits for the shop');
select is(current_setting('test.stored_o1'), '1', 'the code is stored upper case without spaces');
select is(current_setting('test.s_dup_pending'), 'SF011', 'a code that is waiting on another order is refused');
select is(current_setting('test.s_dup_confirmed'), 'SF011', 'a confirmed code cannot be used again');
select is(left(current_setting('test.s_released'), 1), '{', 'a rejected code is released and can be used again');
select is(current_setting('test.s_second_pending'), 'SF012', 'a second code is refused while one is waiting');
select is(current_setting('test.s_short'), '22023', 'a short code is refused');
select is(current_setting('test.s_chars'), '22023', 'a code with a space is refused');
select is(current_setting('test.s_badref'), '22023', 'a malformed reference is refused');
select is(current_setting('test.s_badphone'), '22023', 'a malformed phone is refused');
select is(current_setting('test.s_wrongphone'), 'NULL', 'a right reference with a wrong phone gives null');
select is(current_setting('test.s_unknownref'), 'NULL', 'an unknown reference gives null');
select is(current_setting('test.s_cross'), 'NULL', 'another buyer phone cannot pay an order');
select is(current_setting('test.s_expired'), 'SF008', 'an order past its time cannot take a payment');
select is(current_setting('test.s_paidorder'), 'SF008', 'a paid order cannot take another payment');
select is(current_setting('test.s_cap'), 'SF013', 'an order cannot take more than three codes');
select is(current_setting('test.s_locked'), 'NULL', 'after ten failures even a correct submission is refused');
select is(current_setting('test.n788'), '10', 'a refused submission is not logged again');
select is(current_setting('test.n_o10'), '0', 'no payment was created for the locked order');

select is(current_setting('test.l_pending') ~ '"payment_status": "pending"', true, 'the buyer lookup shows a waiting payment');
select is(current_setting('test.l_rejected') ~ '"payment_status": "rejected"', true, 'the buyer lookup shows a rejected payment');
select is(current_setting('test.l_none') ~ '"payment_status": null', true, 'the buyer lookup shows no payment when none was sent');

select is(current_setting('test.c_out'), '42501', 'the owner of another shop cannot confirm');
select is(current_setting('test.r_out'), '42501', 'the owner of another shop cannot reject');
select is(current_setting('test.c_unknown'), '42501', 'an unknown payment gives the same refusal');
select is(current_setting('test.c_none'), '42501', 'a caller with no session cannot confirm');
select is(current_setting('test.c_null'), '22023', 'confirming without an amount is refused');
select is(current_setting('test.c_wrong'), 'SF009', 'an amount that does not match the total is refused');
select is(current_setting('test.o1_after_wrong'), 'awaiting_payment/pending', 'a wrong amount changes nothing');
select is(current_setting('test.c_ok'), 'ok', 'the exact total confirms the payment');
select is(current_setting('test.o1_after_ok'), 'paid/confirmed', 'the order is paid and the payment confirmed');
select is(current_setting('test.decided_by'), '33333333-3333-4333-8333-333333333333', 'who confirmed the payment is recorded');
select is(current_setting('test.amount'), '150000', 'the confirmed amount is stored');
select is(current_setting('test.c_again'), 'SF014', 'a payment cannot be confirmed twice');
select is(current_setting('test.r_ok'), 'ok', 'a team member can reject a code');
select is(current_setting('test.o2_after'), 'rejected', 'the rejected payment is marked rejected');
select is(current_setting('test.r_again'), 'SF014', 'a payment cannot be rejected twice');
select is(current_setting('test.cancel'), 'ok', 'the owner can cancel an order that has a waiting code');
select is((select p.status::text from public.payments p where p.id = '55555555-5555-4555-8555-555555555555'), 'rejected', 'cancelling closes the waiting payment');
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff4'), 'expired', 'an old order with no code expires');
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff8'), 'awaiting_payment', 'an old order with a fresh waiting code is kept');
select is((select o.status::text from public.orders o where o.id = 'ffffffff-ffff-4fff-8fff-fffffffffff9'), 'expired', 'an old order with a three day old code expires');
select is((select p.status::text from public.payments p where p.id = '55555555-5555-4555-8555-555555555557'), 'rejected', 'the stale code is closed when its order expires');
select is(current_setting('test.c_stale'), 'SF014', 'a closed code cannot be confirmed');

select isnt(current_setting('test.n_att'), '0', 'an attendant sees the payments of their shop');
select is(current_setting('test.n_beta_alpha'), '0', 'the owner of another shop sees none of them');
select is(current_setting('test.n_none'), '0', 'a signed in user without a session sees no payments');

select is(current_setting('test.l_paid') ~ '"status": "paid"', true, 'the buyer lookup shows the order as paid');
select is(current_setting('test.l_paid') ~ '"payment_status": "confirmed"', true, 'the buyer lookup shows the payment as confirmed');

select * from finish();

rollback;
