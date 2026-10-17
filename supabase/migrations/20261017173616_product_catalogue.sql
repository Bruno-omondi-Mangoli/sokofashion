/*
 * Product catalogue: categories, products and product variants.
 *
 * Who may do what:
 *   everyone signed in to the shop can read the catalogue
 *   owners and managers can add and change products and variants
 *   attendants can only read
 *   nobody can delete through the public API, products are archived instead
 *
 * Money is stored as whole numbers in the smallest unit, so 1500 shillings is
 * stored as 150000. The currency code is copied from the shop by the database
 * and cannot be chosen by the caller.
 *
 * Stock is not stored here. It will be calculated from a stock movement ledger.
 */

/*
 * Platform wide categories. Reference data shared by all shops, so there is no
 * shop_id. It lives in the migration because production needs these rows too.
 */
create table public.categories (
  code text primary key check (code ~ '^[a-z]+(-[a-z]+)*$'),
  name_en text not null,
  name_sw text not null,
  sort_order smallint not null default 0
);

alter table public.categories enable row level security;
revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;

create policy "categories are readable by everyone"
  on public.categories
  for select
  to anon, authenticated
  using (true);

insert into public.categories (code, name_en, name_sw, sort_order)
values
  ('clothes', 'Clothes', 'Nguo', 1),
  ('shoes', 'Shoes', 'Viatu', 2),
  ('bags', 'Bags', 'Mikoba', 3),
  ('cosmetics', 'Cosmetics', 'Vipodozi', 4);

create type public.product_status as enum ('draft', 'active', 'archived');

/*
 * One row per item a shop sells, such as a dress. The unique pair of shop_id
 * and id lets variants prove they belong to the same shop as their product.
 */
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_code text not null references public.categories (code),
  name text not null check (length(trim(name)) between 2 and 120),
  description text check (description is null or length(description) <= 2000),
  price_minor integer not null check (price_minor between 0 and 100000000),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  status public.product_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, id)
);

create index products_shop_status_idx on public.products (shop_id, status, created_at desc);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

/*
 * One row per way a product is sold, such as a dress in size M and red. A
 * simple product with no options has one variant with every option empty.
 * Stock is counted per variant. A null price means the product price applies.
 */
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  product_id uuid not null,
  sku text check (sku is null or length(trim(sku)) between 1 and 40),
  size text check (size is null or length(trim(size)) between 1 and 20),
  colour text check (colour is null or length(trim(colour)) between 1 and 30),
  shade text check (shade is null or length(trim(shade)) between 1 and 30),
  volume_ml integer check (volume_ml is null or volume_ml between 1 and 5000),
  expires_on date,
  price_minor integer check (price_minor is null or price_minor between 0 and 100000000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_fk
    foreign key (shop_id, product_id)
    references public.products (shop_id, id)
    on delete cascade
);

/* The same combination of options cannot be listed twice for one product */
create unique index product_variants_options_unique
  on public.product_variants (
    product_id,
    coalesce(lower(size), ''),
    coalesce(lower(colour), ''),
    coalesce(lower(shade), ''),
    coalesce(volume_ml, 0)
  );

/* A seller's own product code is unique inside their shop */
create unique index product_variants_sku_unique
  on public.product_variants (shop_id, lower(sku))
  where sku is not null;

create index product_variants_product_idx on public.product_variants (product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

/*
 * Before a product is inserted: copy the currency from the shop, record who
 * added it, and enforce an abuse limit until plan limits exist in Phase 10.
 * The advisory lock makes simultaneous inserts for one shop wait their turn.
 */
create function public.products_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  product_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('products:' || new.shop_id::text));

  select s.currency_code into new.currency_code
  from public.shops s
  where s.id = new.shop_id;

  new.created_by := (select auth.uid());

  select count(*) into product_count
  from public.products p
  where p.shop_id = new.shop_id;

  if product_count >= 1000 then
    raise exception 'This shop has reached the limit of 1000 products' using errcode = '54000';
  end if;

  return new;
end;
$$;

create trigger products_before_insert
  before insert on public.products
  for each row execute function public.products_before_insert();

/* Before a variant is inserted: at most 50 variants per product */
create function public.product_variants_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  variant_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('variants:' || new.product_id::text));

  select count(*) into variant_count
  from public.product_variants v
  where v.product_id = new.product_id;

  if variant_count >= 50 then
    raise exception 'A product can have at most 50 variants' using errcode = '54000';
  end if;

  return new;
end;
$$;

create trigger product_variants_before_insert
  before insert on public.product_variants
  for each row execute function public.product_variants_before_insert();

/* Trigger functions are never called directly */
revoke execute on function public.products_before_insert() from public, anon, authenticated;
revoke execute on function public.product_variants_before_insert() from public, anon, authenticated;

/*
 * Creates a product and all its variants in one step, so a product can never
 * exist without a variant. This function runs with the caller's own rights, so
 * Row Level Security decides whether the caller may add products to the shop.
 * Each variant in the list may contain: sku, size, colour, shade, volume_ml,
 * expires_on, price_minor. An empty object is a simple product with no options.
 */
create function public.create_product(
  target_shop_id uuid,
  product_name text,
  product_category text,
  product_price_minor integer,
  product_description text,
  initial_status public.product_status,
  variant_list jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_product_id uuid;
begin
  if jsonb_typeof(variant_list) is distinct from 'array'
     or jsonb_array_length(variant_list) < 1 then
    raise exception 'A product needs at least one variant' using errcode = '22023';
  end if;

  if jsonb_array_length(variant_list) > 50 then
    raise exception 'A product can have at most 50 variants' using errcode = '54000';
  end if;

  insert into public.products (shop_id, category_code, name, description, price_minor, status)
  values (
    target_shop_id,
    product_category,
    product_name,
    product_description,
    product_price_minor,
    initial_status
  )
  returning id into new_product_id;

  insert into public.product_variants (
    shop_id, product_id, sku, size, colour, shade, volume_ml, expires_on, price_minor
  )
  select
    target_shop_id, new_product_id, v.sku, v.size, v.colour, v.shade,
    v.volume_ml, v.expires_on, v.price_minor
  from jsonb_to_recordset(variant_list) as v(
    sku text, size text, colour text, shade text,
    volume_ml integer, expires_on date, price_minor integer
  );

  return new_product_id;
end;
$$;

revoke execute on function public.create_product(
  uuid, text, text, integer, text, public.product_status, jsonb
) from public, anon;
grant execute on function public.create_product(
  uuid, text, text, integer, text, public.product_status, jsonb
) to authenticated;

/*
 * Permissions. Everything is removed first, then only what is needed is given
 * back. Columns that must never be chosen by a caller (shop_id after creation,
 * currency_code, created_by) are left out of the update lists. There is no
 * delete permission at all.
 */
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;

grant select on table public.products to authenticated;
grant select on table public.product_variants to authenticated;

grant insert (shop_id, category_code, name, description, price_minor, status)
  on table public.products to authenticated;
grant update (category_code, name, description, price_minor, status)
  on table public.products to authenticated;

grant insert (shop_id, product_id, sku, size, colour, shade, volume_ml, expires_on, price_minor, is_active)
  on table public.product_variants to authenticated;
grant update (sku, size, colour, shade, volume_ml, expires_on, price_minor, is_active)
  on table public.product_variants to authenticated;

/* Row Level Security */
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

create policy "members can read their shop products"
  on public.products
  for select
  to authenticated
  using (public.is_shop_member(shop_id));

create policy "owners and managers can add products"
  on public.products
  for insert
  to authenticated
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]));

create policy "owners and managers can change products"
  on public.products
  for update
  to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]))
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]));

create policy "members can read their shop variants"
  on public.product_variants
  for select
  to authenticated
  using (public.is_shop_member(shop_id));

create policy "owners and managers can add variants"
  on public.product_variants
  for insert
  to authenticated
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]));

create policy "owners and managers can change variants"
  on public.product_variants
  for update
  to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]))
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.shop_role[]));

/*
 * There is no policy that lets anonymous visitors read products. The public
 * storefront will read active products through a dedicated function in Phase 5.
 */
