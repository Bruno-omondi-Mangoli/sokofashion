/*
 * Countries the platform supports. This is reference data, shared by all shops.
 * Compliance and tax settings per country will be added in later migrations.
 *
 * currency_minor_units is how many decimal places the currency has.
 * Amounts are always stored as whole numbers in the smallest unit.
 */
create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  currency_minor_units smallint not null check (currency_minor_units between 0 and 4),
  default_language text not null default 'en' check (default_language in ('en', 'sw')),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

/*
 * Row Level Security is on. With no write policy, nobody can insert, update
 * or delete through the public API. Only migrations and the admin role can.
 */
alter table public.countries enable row level security;

create policy "countries are readable by everyone"
  on public.countries
  for select
  to anon, authenticated
  using (true);

/*
 * Reference data lives in the migration, not in seed.sql, because production
 * needs these rows too. seed.sql only runs on local development databases.
 */
insert into public.countries (code, name, currency_code, currency_minor_units, default_language, is_active)
values
  ('KE', 'Kenya', 'KES', 2, 'en', true),
  ('UG', 'Uganda', 'UGX', 0, 'en', false),
  ('TZ', 'Tanzania', 'TZS', 2, 'sw', false),
  ('RW', 'Rwanda', 'RWF', 0, 'en', false);
