set role anon;
select * from public.shops;
reset role;

insert into public.shops (slug, name, country_code, currency_code)
values ('Bad Slug!', 'X', 'KE', 'KES');


alter table public.shops disable row level security;