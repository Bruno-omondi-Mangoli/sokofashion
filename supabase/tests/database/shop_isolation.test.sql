/*
 * Isolation tests for shops and shop_members.
 * Cast of characters:
 *   alice  owner of Shop A
 *   bob    owner of Shop B, a rival
 *   carol  attendant at Shop A
 *   dave   has no shop yet
 *   frank  attendant at Shop A whose access was revoked
 *   anon   an anonymous visitor
 * Everything runs inside a transaction that is rolled back at the end.
 */
begin;

select plan(29);

/* Helpers that make the database believe a given user is calling */
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
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'dave@example.test'),
  ('55555555-5555-5555-5555-555555555555', 'frank@example.test');

insert into public.shops (id, slug, name, country_code, currency_code) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice-fashion', 'Alice Fashion', 'KE', 'KES'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob-beauty', 'Bob Beauty', 'KE', 'KES');

insert into public.shop_members (shop_id, user_id, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'attendant', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'attendant', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner', true);

/* Alice, owner of Shop A */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select is(
  (select count(*) from public.shops)::int, 1,
  'alice sees exactly one shop'
);

select is(
  (select count(*) from public.shops where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 0,
  'alice cannot see the rival shop'
);

select is(
  (select count(*) from public.shop_members where shop_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 0,
  'alice cannot see the rival shop staff list'
);

select is(
  (select count(*) from public.shop_members where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 3,
  'alice sees the staff list of her own shop'
);

select is(
  public.is_shop_member('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), false,
  'alice is not a member of the rival shop'
);

select is(
  public.has_shop_role('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', array['owner']::public.shop_role[]), true,
  'alice is an owner of her own shop'
);

/* Alice tries to rename the rival shop. It must silently change nothing. */
update public.shops set name = 'Hacked by Alice' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select throws_ok(
  $$ insert into public.shop_members (shop_id, user_id, role)
     values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'owner') $$,
  '42501',
  'permission denied for table shop_members',
  'alice cannot make herself a member of the rival shop'
);

select throws_ok(
  $$ insert into public.shops (slug, name, country_code, currency_code)
     values ('sneaky-shop', 'Sneaky', 'KE', 'KES') $$,
  '42501',
  'permission denied for table shops',
  'alice cannot insert a shop directly'
);

select throws_ok(
  $$ delete from public.shops where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '42501',
  'permission denied for table shops',
  'alice cannot delete her own shop'
);

select throws_ok(
  $$ update public.shop_members set role = 'owner'
     where user_id = '33333333-3333-3333-3333-333333333333' $$,
  '42501',
  'permission denied for table shop_members',
  'alice cannot change a staff role through the API'
);

select throws_ok(
  $$ update public.shops set slug = 'stolen-link'
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '42501',
  'permission denied for table shops',
  'alice cannot change her shop slug'
);

select throws_ok(
  $$ select public.create_shop('Copycat', 'alice-fashion', 'KE') $$,
  '23505',
  'duplicate key value violates unique constraint "shops_slug_key"',
  'a shop link name cannot be taken twice'
);

/* Bob, owner of the rival Shop B */
reset role;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222');

select is(
  (select count(*) from public.shops)::int, 1,
  'bob sees exactly one shop'
);

select is(
  (select count(*) from public.shops where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0,
  'bob cannot see alice shop'
);

/* Carol, an attendant at Shop A */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select is(
  (select count(*) from public.shops where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 1,
  'carol can see the shop she works at'
);

select is(
  public.has_shop_role('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', array['owner']::public.shop_role[]), false,
  'carol is not an owner'
);

/* Carol tries to rename the shop. Only owners may, so nothing must change. */
update public.shops set name = 'Renamed by Carol' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/* Frank, whose access was revoked */
reset role;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');

select is(
  (select count(*) from public.shops)::int, 0,
  'frank, a revoked member, sees no shops'
);

select is(
  public.is_shop_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), false,
  'frank is no longer a member'
);

/* Dave, who has no shop */
reset role;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select is(
  (select count(*) from public.shops)::int, 0,
  'dave sees no shops before creating one'
);

select throws_ok(
  $$ select public.create_shop('Dave Uganda', 'dave-uganda', 'UG') $$,
  '22023',
  'Shops cannot be created in this country yet',
  'a shop cannot be created in an inactive country'
);

select lives_ok(
  $$ select public.create_shop('Dave Shoes', 'dave-shoes', 'KE') $$,
  'dave can create a shop in an active country'
);

select is(
  (select count(*) from public.shops)::int, 1,
  'dave now sees exactly his own new shop'
);

select is(
  (select role::text from public.shop_members
   where user_id = '44444444-4444-4444-4444-444444444444'),
  'owner',
  'dave became the owner of his new shop'
);

/* An anonymous visitor */
reset role;
select tests.become_anon();

select throws_ok(
  $$ select * from public.shops $$,
  '42501',
  'permission denied for table shops',
  'anonymous visitors cannot read shops'
);

select throws_ok(
  $$ select * from public.shop_members $$,
  '42501',
  'permission denied for table shop_members',
  'anonymous visitors cannot read shop members'
);

select throws_ok(
  $$ select public.create_shop('Anon Shop', 'anon-shop', 'KE') $$,
  '42501',
  'permission denied for function create_shop',
  'anonymous visitors cannot create shops'
);

select ok(
  (select count(*) from public.countries) >= 1,
  'anonymous visitors can read the public country list'
);

/* Back to administrator to confirm the attacks changed nothing */
reset role;

select is(
  (select name from public.shops where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'Bob Beauty',
  'the rival shop name was not changed by alice'
);

select is(
  (select name from public.shops where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Alice Fashion',
  'the shop name was not changed by an attendant'
);

select * from finish();

rollback;
