/*
 * Guardrail tests. These fail the moment a future migration adds a table
 * without Row Level Security, or adds a security definer function that does
 * not lock its search_path.
 */
begin;

select plan(2);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'every table in the public schema has row level security enabled'
);

select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (
        p.proconfig is null
        or not exists (
          select 1 from unnest(p.proconfig) as setting where setting like 'search_path=%'
        )
      )
  $$,
  'every security definer function in public locks its search_path'
);

select * from finish();

rollback;
