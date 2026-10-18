/*
 * Stock movement ledger.
 *
 * Stock is never stored as a number that can be overwritten. Every change is a
 * new row in stock_movements, and the amount in stock is the sum of those rows.
 * Rows are never edited or deleted. A mistake is corrected with a reversal row.
 *
 * Nobody writes to the ledger directly. Owners and managers use the functions
 * below, and later the order functions will write sale rows.
 */

/* Stock rows must be able to prove that a variant belongs to the same shop */
alter table public.product_variants
  add constraint product_variants_shop_id_id_key unique (shop_id, id);

create type public.stock_reason as enum (
  'opening',
  'restock',
  'sale',
  'sale_return',
  'adjustment',
  'damage',
  'reversal'
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  variant_id uuid not null,
  quantity_change integer not null,
  reason public.stock_reason not null,
  note text check (note is null or length(note) <= 200),
  reverses_id uuid references public.stock_movements (id),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_movements_variant_fk
    foreign key (shop_id, variant_id)
    references public.product_variants (shop_id, id)
    on delete cascade,
  constraint stock_movements_change_range
    check (quantity_change <> 0 and quantity_change between -100000 and 100000),
  /* Opening, restock and returns add stock. Sales and damage remove it. */
  constraint stock_movements_sign_rule
    check (
      (reason in ('opening', 'restock', 'sale_return') and quantity_change > 0)
      or (reason in ('sale', 'damage') and quantity_change < 0)
      or reason in ('adjustment', 'reversal')
    ),
  /* A row is a reversal if and only if it points at the row it reverses */
  constraint stock_movements_reversal_link
    check ((reason = 'reversal') = (reverses_id is not null))
);

/* A movement can be reversed only once */
create unique index stock_movements_reverses_unique
  on public.stock_movements (reverses_id)
  where reverses_id is not null;

create index stock_movements_variant_idx on public.stock_movements (variant_id, created_at);
create index stock_movements_shop_idx on public.stock_movements (shop_id, created_at desc);

/*
 * Stock can never go below zero. The lock makes two simultaneous changes to the
 * same variant wait for each other, so both cannot pass the check together.
 */
create function public.stock_movements_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stock bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('stock:' || new.variant_id::text));

  select coalesce(sum(m.quantity_change), 0) into current_stock
  from public.stock_movements m
  where m.variant_id = new.variant_id;

  if current_stock + new.quantity_change < 0 then
    raise exception 'Not enough stock for this change' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger stock_movements_before_insert
  before insert on public.stock_movements
  for each row execute function public.stock_movements_before_insert();

revoke execute on function public.stock_movements_before_insert() from public, anon, authenticated;

/*
 * The amount in stock for every variant, including variants that have no
 * movements yet. security_invoker makes the view obey Row Level Security as the
 * person asking, so a shop only ever sees its own stock.
 */
create view public.variant_stock
with (security_invoker = true)
as
select
  v.shop_id,
  v.id as variant_id,
  v.product_id,
  coalesce(sum(m.quantity_change), 0)::integer as on_hand
from public.product_variants v
left join public.stock_movements m on m.variant_id = v.id
group by v.shop_id, v.id, v.product_id;

/*
 * Records one manual stock change. Owners and managers only. Sales are not
 * accepted here, because sales will be recorded by the order functions.
 */
create function public.record_stock_movement(
  target_variant_id uuid,
  change_amount integer,
  movement_reason public.stock_reason,
  movement_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  variant_shop_id uuid;
  new_movement_id uuid;
begin
  select v.shop_id into variant_shop_id
  from public.product_variants v
  where v.id = target_variant_id;

  if variant_shop_id is null
     or not public.has_shop_role(variant_shop_id, array['owner', 'manager']::public.shop_role[]) then
    raise exception 'Only owners and managers can change stock' using errcode = '42501';
  end if;

  if movement_reason not in ('opening', 'restock', 'adjustment', 'damage', 'sale_return') then
    raise exception 'That reason cannot be recorded by hand' using errcode = '22023';
  end if;

  insert into public.stock_movements (shop_id, variant_id, quantity_change, reason, note, created_by)
  values (
    variant_shop_id,
    target_variant_id,
    change_amount,
    movement_reason,
    movement_note,
    (select auth.uid())
  )
  returning id into new_movement_id;

  return new_movement_id;
end;
$$;

/*
 * Cancels an earlier manual movement by adding the opposite one. The original
 * row stays untouched. Reversals cannot be reversed and a movement can be
 * reversed once. Sale rows are reversed by the order functions, not by hand.
 */
create function public.reverse_stock_movement(
  target_movement_id uuid,
  reversal_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  original public.stock_movements%rowtype;
  new_movement_id uuid;
begin
  select * into original
  from public.stock_movements m
  where m.id = target_movement_id;

  if not found
     or not public.has_shop_role(original.shop_id, array['owner', 'manager']::public.shop_role[]) then
    raise exception 'Only owners and managers can change stock' using errcode = '42501';
  end if;

  if original.reason = 'reversal' then
    raise exception 'A reversal cannot be reversed' using errcode = '22023';
  end if;

  if original.reason = 'sale' then
    raise exception 'Sales are reversed by cancelling the order' using errcode = '22023';
  end if;

  insert into public.stock_movements (
    shop_id, variant_id, quantity_change, reason, note, reverses_id, created_by
  )
  values (
    original.shop_id,
    original.variant_id,
    -original.quantity_change,
    'reversal',
    reversal_note,
    original.id,
    (select auth.uid())
  )
  returning id into new_movement_id;

  return new_movement_id;
end;
$$;

/* Permissions: the ledger can be read by members and written only through the functions */
revoke all on table public.stock_movements from anon, authenticated;
revoke all on table public.variant_stock from anon, authenticated;
grant select on table public.stock_movements to authenticated;
grant select on table public.variant_stock to authenticated;

revoke execute on function public.record_stock_movement(uuid, integer, public.stock_reason, text)
  from public, anon;
revoke execute on function public.reverse_stock_movement(uuid, text) from public, anon;
grant execute on function public.record_stock_movement(uuid, integer, public.stock_reason, text)
  to authenticated;
grant execute on function public.reverse_stock_movement(uuid, text) to authenticated;

alter table public.stock_movements enable row level security;

create policy "members can read their shop stock movements"
  on public.stock_movements
  for select
  to authenticated
  using (public.is_shop_member(shop_id));

/*
 * There is deliberately no insert, update or delete policy and no such
 * permission. The ledger changes only through the functions above.
 */
