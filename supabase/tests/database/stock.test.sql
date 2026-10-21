/*
 * Tests for the stock movement ledger.
 * Cast of characters:
 *   alice  owner of Shop A
 *   mia    manager at Shop A
 *   carol  attendant at Shop A
 *   frank  attendant at Shop A whose access was revoked
 *   bob    owner of Shop B, a rival
 *   anon   an anonymous visitor
 */
begin;

select plan(35);

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

insert into public.products (id, shop_id, category_code, name, price_minor, status) values
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clothes', 'Kitenge Dress', 350000, 'draft'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cosmetics', 'Bob Lip Gloss', 90000, 'draft');

insert into public.product_variants (id, shop_id, product_id, size, colour) values
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'M', 'Red'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'L', 'Red');
insert into public.product_variants (id, shop_id, product_id, shade) values
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'Rose');

/* An anonymous visitor */
select tests.become_anon();

select throws_ok(
  $$ select * from public.stock_movements $$,
  '42501',
  'permission denied for table stock_movements',
  'anonymous visitors cannot read the ledger'
);

select throws_ok(
  $$ select * from public.variant_stock $$,
  '42501',
  'permission denied for view variant_stock',
  'anonymous visitors cannot read stock levels'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 5, 'restock') $$,
  '42501',
  'permission denied for function record_stock_movement',
  'anonymous visitors cannot change stock'
);

/* Alice, owner of Shop A */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select set_config('tests.restock',
       public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 10, 'restock', 'First delivery')::text,
       true) $$,
  'alice can record a restock'
);

select is(
  (select on_hand from public.variant_stock where variant_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  10,
  'the amount in stock is the sum of the movements'
);

select is(
  (select created_by from public.stock_movements where id = current_setting('tests.restock')::uuid),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'the movement records who made it'
);

select is(
  (select on_hand from public.variant_stock where variant_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  0,
  'a variant with no movements shows zero in stock'
);

select throws_ok(
  $$ insert into public.stock_movements (shop_id, variant_id, quantity_change, reason)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 500, 'restock') $$,
  '42501',
  'permission denied for table stock_movements',
  'nobody can write to the ledger directly'
);

select throws_ok(
  $$ update public.stock_movements set quantity_change = 500 where id = current_setting('tests.restock')::uuid $$,
  '42501',
  'permission denied for table stock_movements',
  'a movement cannot be edited'
);

select throws_ok(
  $$ delete from public.stock_movements where id = current_setting('tests.restock')::uuid $$,
  '42501',
  'permission denied for table stock_movements',
  'a movement cannot be deleted'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -1, 'sale') $$,
  '22023',
  'That reason cannot be recorded by hand',
  'a sale cannot be recorded by hand'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -5, 'restock') $$,
  '23514',
  'new row for relation "stock_movements" violates check constraint "stock_movements_sign_rule"',
  'a restock cannot remove stock'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 0, 'adjustment') $$,
  '23514',
  'new row for relation "stock_movements" violates check constraint "stock_movements_change_range"',
  'a movement of zero is refused'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 100001, 'restock') $$,
  '23514',
  'new row for relation "stock_movements" violates check constraint "stock_movements_change_range"',
  'an absurdly large movement is refused'
);

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -100, 'damage') $$,
  '23514',
  'Not enough stock for this change',
  'stock can never go below zero'
);

select throws_ok(
  $$ select public.record_stock_movement('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 5, 'restock') $$,
  '42501',
  'Only owners and managers can change stock',
  'alice cannot change stock in the rival shop'
);

/* Mia, manager at Shop A */
reset role;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222');

select lives_ok(
  $$ select set_config('tests.damage',
       public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -2, 'damage', 'Torn at the hem')::text,
       true) $$,
  'a manager can record damaged stock'
);

select is(
  (select on_hand from public.variant_stock where variant_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  8,
  'the damaged items are taken off the stock'
);

/* Carol, attendant at Shop A */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 50, 'restock') $$,
  '42501',
  'Only owners and managers can change stock',
  'an attendant cannot change stock'
);

select is(
  (select on_hand from public.variant_stock where variant_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  8,
  'an attendant can see how much is in stock'
);

select throws_ok(
  $$ select public.reverse_stock_movement(current_setting('tests.damage')::uuid) $$,
  '42501',
  'Only owners and managers can change stock',
  'an attendant cannot reverse a movement'
);

/* Frank, whose access was revoked */
reset role;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');

select throws_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 5, 'restock') $$,
  '42501',
  'Only owners and managers can change stock',
  'a revoked member cannot change stock'
);

/* Bob, owner of the rival Shop B */
reset role;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select is(
  (select count(*) from public.stock_movements where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0,
  'bob cannot see the ledger of the rival shop'
);

select is(
  (select count(*) from public.variant_stock where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0,
  'bob cannot see the stock levels of the rival shop'
);

select throws_ok(
  $$ select public.reverse_stock_movement(current_setting('tests.damage')::uuid) $$,
  '42501',
  'Only owners and managers can change stock',
  'bob cannot reverse a movement in the rival shop'
);

/* Alice corrects a mistake with a reversal */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select set_config('tests.reversal',
       public.reverse_stock_movement(current_setting('tests.damage')::uuid, 'Counted wrong')::text,
       true) $$,
  'alice can reverse the damage record'
);

select is(
  (select on_hand from public.variant_stock where variant_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  10,
  'the reversal puts the stock back'
);

select is(
  (select quantity_change from public.stock_movements where id = current_setting('tests.reversal')::uuid),
  2,
  'the reversal is the exact opposite of the original'
);

select throws_ok(
  $$ select public.reverse_stock_movement(current_setting('tests.damage')::uuid) $$,
  '23505',
  'duplicate key value violates unique constraint "stock_movements_reverses_unique"',
  'a movement can be reversed only once'
);

select throws_ok(
  $$ select public.reverse_stock_movement(current_setting('tests.reversal')::uuid) $$,
  '22023',
  'A reversal cannot be reversed',
  'a reversal cannot be reversed'
);

select lives_ok(
  $$ select public.record_stock_movement('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -9, 'damage', 'Water damage') $$,
  'alice can record more damage'
);

select throws_ok(
  $$ select public.reverse_stock_movement(current_setting('tests.restock')::uuid) $$,
  '23514',
  'Not enough stock for this change',
  'a restock cannot be reversed once the stock is gone'
);

/* The administrator records a sale, as the order system will do later */
reset role;

insert into public.stock_movements (shop_id, variant_id, quantity_change, reason)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -1, 'sale');

select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.reverse_stock_movement(
       (select id from public.stock_movements where reason = 'sale' limit 1)) $$,
  '22023',
  'Sales are reversed by cancelling the order',
  'a sale cannot be reversed by hand'
);

/* Back to administrator to confirm nothing was damaged */
reset role;

select throws_ok(
  $$ insert into public.stock_movements (shop_id, variant_id, quantity_change, reason)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 1, 'restock') $$,
  '23503',
  'insert or update on table "stock_movements" violates foreign key constraint "stock_movements_variant_fk"',
  'a movement cannot name a variant that belongs to another shop'
);

select is(
  (select quantity_change from public.stock_movements where id = current_setting('tests.restock')::uuid),
  10,
  'the original restock row was never changed'
);

select * from finish();

rollback;
