/*
  Chunk 29: release expired orders for a shop team.
  Any active team member may call this. It only applies the 24 hour rule that
  already exists, so it gives nobody extra power. It takes the same lock as
  place_order, so it cannot collide with a new order.
*/

create or replace function public.release_expired_orders(target_shop_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  due integer;
begin
  if target_shop_id is null
     or not coalesce(public.is_shop_member(target_shop_id), false) then
    raise exception 'You are not on this shop team' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('orders:' || target_shop_id::text));

  select pg_catalog.count(*) into due
  from public.orders o
  where o.shop_id = target_shop_id
    and o.status = 'awaiting_payment'
    and o.expires_at <= pg_catalog.now();

  perform public.expire_stale_orders_for_shop(target_shop_id);

  return due;
end;
$function$;

revoke all on function public.release_expired_orders(uuid) from public, anon, authenticated;
grant execute on function public.release_expired_orders(uuid) to authenticated;
