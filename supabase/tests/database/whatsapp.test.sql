/*
  Chunk 32: tests that try to break set_shop_whatsapp.
  Shops: alpha (1111 owner, 2222 manager, 3333 attendant), beta (4444 owner, never sets a number).
*/

begin;

select plan(23);

set local session_replication_role = replica;

insert into public.shops (id, slug, name, country_code, currency_code, language, status, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'alphashop', 'Alpha Shop', 'KE', 'KES', 'en', 'active', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'betashop', 'Beta Shop', 'KE', 'KES', 'en', 'active', now(), now());

insert into public.shop_members (id, shop_id, user_id, role, is_active, created_at) values
  ('99999999-9999-4999-8999-999999999991', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'owner', true, now()),
  ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '22222222-2222-4222-8222-222222222222', 'manager', true, now()),
  ('99999999-9999-4999-8999-999999999993', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'attendant', true, now()),
  ('99999999-9999-4999-8999-999999999994', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'owner', true, now());

set local session_replication_role = origin;

/* Attendant, manager, an outsider, an unknown shop and a caller with no session all try to set the number */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0700000000');
    perform set_config('test.w_att', 'ok', true);
  exception when others then
    perform set_config('test.w_att', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0700000000');
    perform set_config('test.w_mgr', 'ok', true);
  exception when others then
    perform set_config('test.w_mgr', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0700000000');
    perform set_config('test.w_out', 'ok', true);
  exception when others then
    perform set_config('test.w_out', sqlstate, true);
  end;
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', '0700000000');
    perform set_config('test.w_unknown', 'ok', true);
  exception when others then
    perform set_config('test.w_unknown', sqlstate, true);
  end;

  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0700000000');
    perform set_config('test.w_none', 'ok', true);
  exception when others then
    perform set_config('test.w_none', sqlstate, true);
  end;
end;
$$;

reset role;

do $$
begin
  perform set_config('test.after_refused', coalesce((select s.whatsapp_phone from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'NULL'), true);
end;
$$;

/* The owner saves a local style number */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0712 345 678');
    perform set_config('test.w_owner', 'ok', true);
  exception when others then
    perform set_config('test.w_owner', sqlstate, true);
  end;
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.s1', coalesce((select s.whatsapp_phone from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'NULL'), true);
end;
$$;

/* Then an international style number with a plus sign, spaces and hyphens */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '+254 798-765-432');
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.s2', coalesce((select s.whatsapp_phone from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'NULL'), true);
end;
$$;

/* Three bad numbers are refused and the stored number does not change */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '12345');
    perform set_config('test.bad_short', 'ok', true);
  exception when others then
    perform set_config('test.bad_short', sqlstate, true);
  end;
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '0202345678');
    perform set_config('test.bad_landline', 'ok', true);
  exception when others then
    perform set_config('test.bad_landline', sqlstate, true);
  end;
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'call me');
    perform set_config('test.bad_text', 'ok', true);
  exception when others then
    perform set_config('test.bad_text', sqlstate, true);
  end;
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.s2b', coalesce((select s.whatsapp_phone from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'NULL'), true);
end;
$$;

/* A visitor reads the checkout info of both shops */
set local role anon;

do $$
begin
  perform set_config('test.c_alpha', coalesce(public.get_public_checkout_info('alphashop')::text, 'NULL'), true);
  perform set_config('test.c_beta', coalesce(public.get_public_checkout_info('betashop')::text, 'NULL'), true);
end;
$$;

reset role;

/* The owner removes the number with only spaces */
set local role authenticated;

do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  begin
    perform public.set_shop_whatsapp('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '   ');
    perform set_config('test.w_clear', 'ok', true);
  exception when others then
    perform set_config('test.w_clear', sqlstate, true);
  end;
  perform set_config('request.jwt.claims', '', true);
end;
$$;

reset role;

do $$
begin
  perform set_config('test.cleared', coalesce((select s.whatsapp_phone from public.shops s where s.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'), 'NULL'), true);
end;
$$;

select is((select count(*)::int from public.shops where slug in ('alphashop', 'betashop')), 2, 'fixture: two shops exist');
select has_column('public', 'shops', 'whatsapp_phone', 'shops has a whatsapp_phone column');
select has_function('public', 'set_shop_whatsapp', array['uuid', 'text'], 'set_shop_whatsapp exists');
select is(has_function_privilege('anon', 'public.set_shop_whatsapp(uuid, text)', 'execute'), false, 'anon cannot run set_shop_whatsapp');
select is(has_function_privilege('authenticated', 'public.set_shop_whatsapp(uuid, text)', 'execute'), true, 'authenticated can run set_shop_whatsapp');

select is(current_setting('test.w_att'), '42501', 'an attendant cannot set the number');
select is(current_setting('test.w_mgr'), '42501', 'a manager cannot set the number');
select is(current_setting('test.w_out'), '42501', 'the owner of another shop cannot set the number');
select is(current_setting('test.w_unknown'), '42501', 'an unknown shop gives the same refusal');
select is(current_setting('test.w_none'), '42501', 'a caller with no session is refused');
select is(current_setting('test.after_refused'), 'NULL', 'the number is still empty after the refused attempts');

select is(current_setting('test.w_owner'), 'ok', 'the owner can save a number');
select is(current_setting('test.s1'), '254712345678', 'a local style number is stored in the standard form');
select is(current_setting('test.s2'), '254798765432', 'a plus sign, spaces and hyphens are accepted');

select is(current_setting('test.bad_short'), '22023', 'a short number is refused');
select is(current_setting('test.bad_landline'), '22023', 'a landline style number is refused');
select is(current_setting('test.bad_text'), '22023', 'text instead of a number is refused');
select is(current_setting('test.s2b'), '254798765432', 'the stored number is unchanged after bad numbers');

select is(current_setting('test.c_alpha')::jsonb ->> 'whatsapp_phone', '254798765432', 'the checkout info returns the number');
select is(current_setting('test.c_beta')::jsonb ->> 'whatsapp_phone', null::text, 'a shop with no number returns null');
select is((select count(*)::int from jsonb_object_keys(current_setting('test.c_alpha')::jsonb)), 6, 'exactly six fields are returned');

select is(current_setting('test.w_clear'), 'ok', 'the owner can remove the number');
select is(current_setting('test.cleared'), 'NULL', 'a number of only spaces becomes empty');

select * from finish();

rollback;
