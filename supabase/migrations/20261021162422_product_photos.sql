/*
 * Product photos.
 *
 * Each product has one to four photos. The files live in Supabase Storage, in
 * a public bucket, and this table records which photos belong to which
 * product. Every photo is stored twice, a main size and a small thumbnail, so
 * lists and the storefront can load the small one on slow connections.
 *
 * File names are never chosen by the browser. They are always
 * shop_id/product_id/image_id.webp (or .jpg) for the main photo and
 * shop_id/product_id/image_id_t.webp (or _t.jpg) for the thumbnail.
 */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 512000, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  product_id uuid not null,
  sort_order smallint not null check (sort_order between 1 and 4),
  storage_path text not null,
  width smallint not null check (width between 1 and 4000),
  height smallint not null check (height between 1 and 4000),
  byte_size integer not null check (byte_size between 1 and 1100000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint product_images_product_fk
    foreign key (shop_id, product_id)
    references public.products (shop_id, id)
    on delete cascade,
  constraint product_images_order_unique unique (product_id, sort_order),
  constraint product_images_path_rule
    check (
      storage_path in (
        shop_id::text || '/' || product_id::text || '/' || id::text || '.webp',
        shop_id::text || '/' || product_id::text || '/' || id::text || '.jpg'
      )
    )
);

create index product_images_product_idx on public.product_images (product_id, sort_order);
create index product_images_shop_idx on public.product_images (shop_id);

/*
 * A product cannot go live without a photo. This runs for everybody, including
 * administrators, so the rule cannot be skipped by accident.
 */
create function public.products_require_photo_to_go_live()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    if not exists (select 1 from public.product_images i where i.product_id = new.id) then
      raise exception 'A product needs at least one photo to go live' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger products_require_photo_to_go_live
  before insert or update of status on public.products
  for each row execute function public.products_require_photo_to_go_live();

revoke execute on function public.products_require_photo_to_go_live()
  from public, anon, authenticated;

/*
 * Reads the shop id out of a file name, but only when the whole name follows
 * the allowed pattern. Anything else gives null, which never matches a shop.
 */
create function public.product_image_folder_shop(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_t)?\.(webp|jpg)$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

/* Can the current user add or delete the photo file with this name? */
create function public.can_manage_product_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.has_shop_role(
      public.product_image_folder_shop(object_name),
      array['owner', 'manager']::public.shop_role[]
    ),
    false
  );
$$;

revoke execute on function public.product_image_folder_shop(text) from public, anon;
revoke execute on function public.can_manage_product_image(text) from public, anon;
grant execute on function public.product_image_folder_shop(text) to authenticated;
grant execute on function public.can_manage_product_image(text) to authenticated;

/*
 * Rules for the files themselves. Owners and managers can add and delete
 * files in their own shop's folder. Members can read them. Nobody can
 * overwrite a file, because every photo gets a new unique name.
 */
create policy "product images can be added by owners and managers"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.can_manage_product_image(name));

create policy "product images can be deleted by owners and managers"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.can_manage_product_image(name));

create policy "product images can be read by shop members"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_shop_member(public.product_image_folder_shop(name))
  );

/*
 * Registers a photo after the browser has uploaded both files. The database
 * works out the file names itself, checks that both files really exist, takes
 * their sizes from storage, and picks the first free slot from 1 to 4.
 */
create function public.add_product_image(
  target_product_id uuid,
  new_image_id uuid,
  image_ext text,
  image_width integer,
  image_height integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  product_shop_id uuid;
  main_path text;
  thumb_path text;
  main_size bigint;
  thumb_size bigint;
  shop_total bigint;
  free_slot integer;
begin
  select p.shop_id into product_shop_id
  from public.products p
  where p.id = target_product_id;

  if product_shop_id is null
     or not public.has_shop_role(product_shop_id, array['owner', 'manager']::public.shop_role[]) then
    raise exception 'Only owners and managers can change photos' using errcode = '42501';
  end if;

  if image_ext not in ('webp', 'jpg') then
    raise exception 'That photo type is not supported' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('photos:' || target_product_id::text));

  if (select count(*) from public.product_images i where i.product_id = target_product_id) >= 4 then
    raise exception 'A product can have at most 4 photos' using errcode = '54000';
  end if;

  main_path := product_shop_id::text || '/' || target_product_id::text || '/'
    || new_image_id::text || '.' || image_ext;
  thumb_path := product_shop_id::text || '/' || target_product_id::text || '/'
    || new_image_id::text || '_t.' || image_ext;

  select (o.metadata ->> 'size')::bigint into main_size
  from storage.objects o
  where o.bucket_id = 'product-images' and o.name = main_path;

  select (o.metadata ->> 'size')::bigint into thumb_size
  from storage.objects o
  where o.bucket_id = 'product-images' and o.name = thumb_path;

  if main_size is null or thumb_size is null then
    raise exception 'The photo was not uploaded' using errcode = '22023';
  end if;

  /* 100 MB per shop until plan limits exist. The free plan has about 1 GB in total. */
  select coalesce(sum(i.byte_size), 0) into shop_total
  from public.product_images i
  where i.shop_id = product_shop_id;

  if shop_total + main_size + thumb_size > 104857600 then
    raise exception 'Photo storage limit reached for this shop' using errcode = '54000';
  end if;

  select min(slot) into free_slot
  from generate_series(1, 4) as slot
  where slot not in (
    select i.sort_order from public.product_images i where i.product_id = target_product_id
  );

  insert into public.product_images (
    id, shop_id, product_id, sort_order, storage_path, width, height, byte_size, created_by
  )
  values (
    new_image_id,
    product_shop_id,
    target_product_id,
    free_slot,
    main_path,
    image_width,
    image_height,
    main_size + thumb_size,
    (select auth.uid())
  );

  return new_image_id;
end;
$$;

/*
 * Removes a photo record and returns the main file name, so the app can then
 * delete both files from storage. A live product must keep at least one photo.
 */
create function public.remove_product_image(target_image_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  image_row public.product_images%rowtype;
  current_status public.product_status;
  image_count integer;
begin
  select * into image_row
  from public.product_images i
  where i.id = target_image_id;

  if not found
     or not public.has_shop_role(image_row.shop_id, array['owner', 'manager']::public.shop_role[]) then
    raise exception 'Only owners and managers can change photos' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('photos:' || image_row.product_id::text));

  select p.status into current_status
  from public.products p
  where p.id = image_row.product_id;

  select count(*) into image_count
  from public.product_images i
  where i.product_id = image_row.product_id;

  if current_status = 'active' and image_count <= 1 then
    raise exception 'A live product needs at least one photo' using errcode = '22023';
  end if;

  delete from public.product_images where id = target_image_id;

  return image_row.storage_path;
end;
$$;

revoke execute on function public.add_product_image(uuid, uuid, text, integer, integer)
  from public, anon;
revoke execute on function public.remove_product_image(uuid) from public, anon;
grant execute on function public.add_product_image(uuid, uuid, text, integer, integer)
  to authenticated;
grant execute on function public.remove_product_image(uuid) to authenticated;

/* Members can read the photo records. Nobody changes them directly. */
revoke all on table public.product_images from anon, authenticated;
grant select on table public.product_images to authenticated;

alter table public.product_images enable row level security;

create policy "members can read their shop product images"
  on public.product_images
  for select
  to authenticated
  using (public.is_shop_member(shop_id));

/*
 * There is no insert, update or delete policy and no such permission. Photo
 * records change only through add_product_image and remove_product_image.
 */
