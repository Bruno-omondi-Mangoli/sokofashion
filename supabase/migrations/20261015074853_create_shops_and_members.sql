/*
 * Shops, shop membership and roles.
 * This is the foundation of multi-tenancy. Every shop owned table added later
 * carries a shop_id and uses the helper functions defined here.
 */

/* Fixed lists of allowed values */
create type public.shop_role as enum ('owner', 'manager', 'attendant');
create type public.shop_status as enum ('active', 'suspended');

/* Keeps updated_at correct without relying on application code */
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

/*
 * One row per seller business.
 * currency_code is copied from the country when the shop is created, so a later
 * change to country data never rewrites the history of an existing shop.
 */
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (length(slug) between 3 and 40 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 2 and 80),
  country_code text not null references public.countries (code),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  language text not null default 'en' check (language in ('en', 'sw')),
  status public.shop_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shops_set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

/*
 * Which user belongs to which shop, and with what role.
 * A person can belong to several shops. A person can appear only once per shop.
 * Memberships are deactivated, not deleted, so history stays understandable.
 */
create table public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.shop_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index shop_members_user_id_idx on public.shop_members (user_id);

/*
 * Helper: is the current user an active member of this shop?
 * Security definer so that policies on shop_members can call it without looping.
 * It only ever answers about the current user, never about anyone else.
 */
create function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shop_members m
    where m.shop_id = target_shop_id
      and m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

/* Helper: is the current user an active member of this shop with one of these roles? */
create function public.has_shop_role(target_shop_id uuid, allowed_roles public.shop_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shop_members m
    where m.shop_id = target_shop_id
      and m.user_id = (select auth.uid())
      and m.is_active
      and m.role = any (allowed_roles)
  );
$$;

/*
 * The only way to create a shop. It creates the shop and the owner membership
 * together, so nobody can create a shop without an owner or give themselves a
 * role in someone else's shop. Only active countries are accepted.
 */
create function public.create_shop(shop_name text, shop_slug text, shop_country_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  chosen_country public.countries%rowtype;
  new_shop_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a shop' using errcode = '28000';
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

/*
 * Permissions. Supabase grants broad rights on new tables by default, so we
 * remove everything first and give back only what is needed. Row Level Security
 * then decides which rows those rights apply to.
 */
revoke all on table public.shops from anon, authenticated;
revoke all on table public.shop_members from anon, authenticated;

grant select on table public.shops to authenticated;
grant select on table public.shop_members to authenticated;

/* Owners may change only the display name and language, never slug, status or country */
grant update (name, language) on table public.shops to authenticated;

/* Functions are callable through the public API, so limit who may call them */
revoke execute on function public.is_shop_member(uuid) from public, anon;
revoke execute on function public.has_shop_role(uuid, public.shop_role[]) from public, anon;
revoke execute on function public.create_shop(text, text, text) from public, anon;
grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.has_shop_role(uuid, public.shop_role[]) to authenticated;
grant execute on function public.create_shop(text, text, text) to authenticated;

/* Row Level Security */
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;

create policy "members can read their shops"
  on public.shops
  for select
  to authenticated
  using (public.is_shop_member(id));

create policy "owners can update their shop"
  on public.shops
  for update
  to authenticated
  using (public.has_shop_role(id, array['owner']::public.shop_role[]))
  with check (public.has_shop_role(id, array['owner']::public.shop_role[]));

create policy "members can read the people in their shops"
  on public.shop_members
  for select
  to authenticated
  using (public.is_shop_member(shop_id));

/*
 * There is deliberately no insert, update or delete policy on shop_members.
 * Adding, changing and removing staff will go through controlled functions
 * built in the staff invitation chunk. Until then nobody can change membership
 * through the public API.
 *
 * There is also no policy letting anonymous visitors read shops. The public
 * storefront will read a small, safe subset of shop data through a dedicated
 * function in Phase 5.
 */
