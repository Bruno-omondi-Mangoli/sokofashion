/*
 * Two protections for shop creation.
 * 1. Reserved link names cannot be used, because they would clash with real
 *    pages or let a seller pose as the platform.
 * 2. One user may create at most 3 shops, which stops name squatting until
 *    stronger rate limiting exists.
 */

alter table public.shops
  add constraint shops_slug_not_reserved
  check (
    slug <> all (array[
      'about', 'account', 'admin', 'api', 'app', 'assets', 'auth', 'cart',
      'checkout', 'dashboard', 'demo', 'dukalink', 'explore', 'health', 'help',
      'login', 'logout', 'mail', 'marketplace', 'new', 'onboarding', 'order',
      'orders', 'owner', 'pricing', 'privacy', 'register', 'search', 'settings',
      'shop', 'shops', 'signup', 'sokofashion', 'staff', 'static', 'store',
      'stores', 'support', 'terms', 'test', 'www'
    ])
  );

/*
 * Replaces create_shop from the earlier migration with the same signature, so
 * existing permissions stay in place. The only change is the shop limit.
 * The advisory lock makes two simultaneous requests from one user wait for
 * each other, so both cannot pass the limit check together.
 */
create or replace function public.create_shop(shop_name text, shop_slug text, shop_country_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  chosen_country public.countries%rowtype;
  new_shop_id uuid;
  shops_created integer;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a shop' using errcode = '28000';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_user_id::text));

  select count(*) into shops_created
  from public.shops
  where created_by = current_user_id;

  if shops_created >= 3 then
    raise exception 'You have reached the limit of 3 shops' using errcode = '54000';
  end if;

  select * into chosen_country
  from public.countries
  where code = shop_country_code and is_active;

  if not found then
    raise exception 'Shops cannot be created in this country yet' using errcode = '22023';
  end if;

  insert into public.shops (name, slug, country_code, currency_code, language, created_by)
  values (
    shop_name,
    shop_slug,
    chosen_country.code,
    chosen_country.currency_code,
    chosen_country.default_language,
    current_user_id
  )
  returning id into new_shop_id;

  insert into public.shop_members (shop_id, user_id, role)
  values (new_shop_id, current_user_id, 'owner');

  return new_shop_id;
end;
$$;
