/*
 * Tests for staff invitations and team management.
 * Cast of characters:
 *   alice  owner of Shop A
 *   bob    owner of Shop B, a rival
 *   carol  gets invited to Shop A as an attendant
 *   dave   has an unconfirmed email and is invited to Shop A
 *   erin   a stranger with no invitation
 *   frank  already an attendant at Shop A
 *   anon   an anonymous visitor
 */
begin;

select plan(32);

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

/* Setup, done as the database administrator. Dave's email is not confirmed. */
insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test', now()),
  ('44444444-4444-4444-4444-444444444444', 'dave@example.test', null),
  ('55555555-5555-5555-5555-555555555555', 'erin@example.test', now()),
  ('66666666-6666-6666-6666-666666666666', 'frank@example.test', now());

insert into public.shops (id, slug, name, country_code, currency_code) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice-fashion', 'Alice Fashion', 'KE', 'KES'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob-beauty', 'Bob Beauty', 'KE', 'KES');

insert into public.shop_members (shop_id, user_id, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'attendant', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner', true);

/* Alice, owner of Shop A */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ' Carol@Example.test ', 'attendant') $$,
  'alice can invite carol, and the email is cleaned up'
);

select is(
  (select count(*) from public.shop_invitations)::int, 1,
  'alice sees her one invitation'
);

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'new@example.test', 'owner') $$,
  '22023',
  'Staff can only be invited as manager or attendant',
  'nobody can be invited as an owner'
);

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'carol@example.test', 'attendant') $$,
  '23505',
  'An invitation for this email is already pending',
  'the same email cannot have two pending invitations'
);

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'not-an-email', 'attendant') $$,
  '22023',
  'Enter a valid email address',
  'a bad email address is refused'
);

select throws_ok(
  $$ select public.invite_staff('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'spy@example.test', 'attendant') $$,
  '42501',
  'Only the shop owner can do this',
  'alice cannot invite people into the rival shop'
);

select throws_ok(
  $$ insert into public.shop_invitations (shop_id, email, role)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x@example.test', 'attendant') $$,
  '42501',
  'permission denied for table shop_invitations',
  'alice cannot insert invitations directly'
);

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'frank@example.test', 'attendant') $$,
  '23505',
  'That person is already on your team',
  'someone already on the team cannot be invited again'
);

select lives_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dave@example.test', 'attendant') $$,
  'alice can invite dave'
);

select is(
  (select count(*) from public.list_shop_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'))::int, 2,
  'alice sees her two team members with emails'
);

select throws_ok(
  $$ select * from public.list_shop_staff('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  '42501',
  'Only the shop owner can do this',
  'alice cannot list the rival shop team'
);

/* Remember ids for later steps, done as the administrator */
reset role;
do $$
begin
  perform set_config(
    'tests.carol_invite',
    (select id::text from public.shop_invitations where email = 'carol@example.test'),
    true
  );
  perform set_config(
    'tests.dave_invite',
    (select id::text from public.shop_invitations where email = 'dave@example.test'),
    true
  );
  perform set_config(
    'tests.alice_member',
    (select id::text from public.shop_members
      where user_id = '11111111-1111-1111-1111-111111111111'
        and shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    true
  );
end;
$$;

/* Bob, owner of the rival Shop B */
select tests.authenticate_as('22222222-2222-2222-2222-222222222222');

select is(
  (select count(*) from public.shop_invitations)::int, 0,
  'bob cannot see invitations of other shops'
);

select throws_ok(
  $$ select public.revoke_invitation(current_setting('tests.carol_invite')::uuid) $$,
  '42501',
  'Only the shop owner can do this',
  'bob cannot cancel an invitation of another shop'
);

/* Carol, the invited person */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select is(
  (select count(*) from public.my_pending_invitations())::int, 1,
  'carol sees her one pending invitation'
);

select throws_ok(
  $$ select public.accept_invitation(current_setting('tests.dave_invite')::uuid) $$,
  'P0002',
  'Invitation not found',
  'carol cannot accept an invitation meant for dave'
);

select lives_ok(
  $$ select public.accept_invitation(current_setting('tests.carol_invite')::uuid) $$,
  'carol can accept her own invitation'
);

select is(
  (select count(*) from public.shops where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 1,
  'carol can now see the shop'
);

select is(
  public.has_shop_role('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', array['attendant']::public.shop_role[]),
  true,
  'carol is an attendant'
);

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'friend@example.test', 'attendant') $$,
  '42501',
  'Only the shop owner can do this',
  'an attendant cannot invite people'
);

select throws_ok(
  $$ select public.set_staff_member_active(current_setting('tests.alice_member')::uuid, false) $$,
  '42501',
  'Only the shop owner can do this',
  'an attendant cannot deactivate the owner'
);

/* Dave, whose email is not confirmed */
reset role;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select throws_ok(
  $$ select public.accept_invitation(current_setting('tests.dave_invite')::uuid) $$,
  'P0002',
  'Invitation not found',
  'dave cannot accept before his email is confirmed'
);

select is(
  (select count(*) from public.my_pending_invitations())::int, 0,
  'dave sees no invitations until his email is confirmed'
);

/* Erin, a stranger */
reset role;
select tests.authenticate_as('55555555-5555-5555-5555-555555555555');

select throws_ok(
  $$ select public.accept_invitation(current_setting('tests.carol_invite')::uuid) $$,
  'P0002',
  'Invitation not found',
  'a stranger cannot accept an invitation that was already used'
);

/* Remember carol's membership id */
reset role;
do $$
begin
  perform set_config(
    'tests.carol_member',
    (select id::text from public.shop_members
      where user_id = '33333333-3333-3333-3333-333333333333'
        and shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    true
  );
end;
$$;

/* Alice switches carol off */
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.set_staff_member_active(current_setting('tests.carol_member')::uuid, false) $$,
  'alice can deactivate carol'
);

/* Carol has lost access */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select is(
  (select count(*) from public.shops)::int, 0,
  'carol sees no shops after being deactivated'
);

/* Alice again */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.set_staff_member_active(current_setting('tests.alice_member')::uuid, false) $$,
  '22023',
  'Owners cannot be deactivated',
  'an owner can never be deactivated, not even by herself'
);

select lives_ok(
  $$ select public.set_staff_member_active(current_setting('tests.carol_member')::uuid, true) $$,
  'alice can reactivate carol'
);

select lives_ok(
  $$ select public.revoke_invitation(current_setting('tests.dave_invite')::uuid) $$,
  'alice can cancel the invitation for dave'
);

reset role;

select is(
  (select status from public.shop_invitations where id = current_setting('tests.dave_invite')::uuid),
  'revoked',
  'the cancelled invitation is marked revoked'
);

/* Fill the team to the limit: carol and frank are active, and 8 more are pending */
insert into public.shop_invitations (shop_id, email, role, invited_by)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'filler' || n || '@example.test',
  'attendant'::public.shop_role,
  '11111111-1111-1111-1111-111111111111'::uuid
from generate_series(1, 8) as n;

select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'extra@example.test', 'attendant') $$,
  '54000',
  'Your team has reached the limit of 10 people',
  'a team cannot grow past 10 people'
);

/* An anonymous visitor */
reset role;
select tests.become_anon();

select throws_ok(
  $$ select public.invite_staff('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'anon@example.test', 'attendant') $$,
  '42501',
  'permission denied for function invite_staff',
  'anonymous visitors cannot invite staff'
);

select throws_ok(
  $$ select * from public.my_pending_invitations() $$,
  '42501',
  'permission denied for function my_pending_invitations',
  'anonymous visitors cannot list invitations'
);

select * from finish();

rollback;
