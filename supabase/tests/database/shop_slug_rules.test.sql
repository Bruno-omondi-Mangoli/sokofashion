/*
 * Tests for reserved link names and the limit of 3 shops per user.
 * Cast of characters:
 *   erin   tries reserved names, then creates shops until the limit
 *   fiona  a second user, to prove the limit is per user
 */
begin;

select plan(9);

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

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'erin@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'fiona@example.test');

/* Erin */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.create_shop('Admin Shop', 'admin', 'KE') $$,
  '23514',
  'new row for relation "shops" violates check constraint "shops_slug_not_reserved"',
  'a shop cannot use the reserved link name admin'
);

select throws_ok(
  $$ select public.create_shop('Dashboard Shop', 'dashboard', 'KE') $$,
  '23514',
  'new row for relation "shops" violates check constraint "shops_slug_not_reserved"',
  'a shop cannot use the reserved link name dashboard'
);

select lives_ok(
  $$ select public.create_shop('Erin One', 'erin-one', 'KE') $$,
  'erin can create her first shop'
);

select lives_ok(
  $$ select public.create_shop('Erin Two', 'erin-two', 'KE') $$,
  'erin can create her second shop'
);

select lives_ok(
  $$ select public.create_shop('Erin Three', 'erin-three', 'KE') $$,
  'erin can create her third shop'
);

select throws_ok(
  $$ select public.create_shop('Erin Four', 'erin-four', 'KE') $$,
  '54000',
  'You have reached the limit of 3 shops',
  'erin cannot create a fourth shop'
);

select is(
  (select count(*) from public.shops)::int, 3,
  'erin sees exactly her three shops'
);

/* Fiona */
reset role;
select tests.authenticate_as('22222222-2222-2222-2222-222222222222');

select lives_ok(
  $$ select public.create_shop('Fiona Boutique', 'fiona-boutique', 'KE') $$,
  'fiona can still create a shop, because the limit is per user'
);

/* The database rule holds even for a direct insert by an administrator */
reset role;

select throws_ok(
  $$ insert into public.shops (slug, name, country_code, currency_code)
     values ('api', 'Api Shop', 'KE', 'KES') $$,
  '23514',
  'new row for relation "shops" violates check constraint "shops_slug_not_reserved"',
  'even a direct insert cannot use a reserved link name'
);

select * from finish();

rollback;
