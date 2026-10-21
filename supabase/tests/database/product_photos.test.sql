/*
 * Tests for product photos: file name rules, registering and removing photos,
 * the four photo limit, the rule that a product needs a photo to go live, and
 * the storage cap per shop.
 * Cast of characters:
 *   alice  owner of Shop A
 *   carol  attendant at Shop A
 *   bob    owner of Shop B, a rival
 *   anon   an anonymous visitor
 *
 * Files are added to storage as the administrator, as the upload service does.
 * The rules about who may add files are tested through can_manage_product_image,
 * which the storage policies use.
 */
begin;

select plan(42);

create schema tests;

create function tests.authenticate_as(caller_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', caller_id, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', caller_id::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.become_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

/* Pretends the browser uploaded both files of a photo, with a size for each */
create function tests.upload(shop_id uuid, product_id uuid, image_id uuid, main_size bigint, thumb_size bigint)
returns void
language plpgsql
as $$
begin
  insert into storage.objects (bucket_id, name, metadata) values
    ('product-images', shop_id::text || '/' || product_id::text || '/' || image_id::text || '.webp',
     jsonb_build_object('size', main_size)),
    ('product-images', shop_id::text || '/' || product_id::text || '/' || image_id::text || '_t.webp',
     jsonb_build_object('size', thumb_size));
end;
$$;

/* Setup, done as the database administrator */
insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.test', now()),
  ('44444444-4444-4444-4444-444444444444', 'bob@example.test', now());

insert into public.shops (id, slug, name, country_code, currency_code) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice-fashion', 'Alice Fashion', 'KE', 'KES'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob-beauty', 'Bob Beauty', 'KE', 'KES');

insert into public.shop_members (shop_id, user_id, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'attendant', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'owner', true);

insert into public.products (id, shop_id, category_code, name, price_minor, status) values
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clothes', 'Kitenge Dress', 350000, 'draft'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clothes', 'No Photo Top', 150000, 'draft'),
  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bags', 'Heavy Bag', 250000, 'draft'),
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shoes', 'Single Photo Shoe', 300000, 'draft'),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cosmetics', 'Bob Lip Gloss', 90000, 'draft');

select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 120000, 20000);

/* The bucket and its policies */
select is(
  (select file_size_limit from storage.buckets where id = 'product-images'),
  512000::bigint,
  'the photo bucket exists and limits each file to 500 KB'
);

select is(
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname like 'product images%')::int,
  3,
  'the three storage policies for product photos exist'
);

/* An anonymous visitor */
select tests.become_anon();

select throws_ok(
  $$ select * from public.product_images $$,
  '42501',
  'permission denied for table product_images',
  'anonymous visitors cannot read photo records'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'webp', 800, 600) $$,
  '42501',
  'permission denied for function add_product_image',
  'anonymous visitors cannot add photos'
);

select throws_ok(
  $$ select public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1.webp') $$,
  '42501',
  'permission denied for function can_manage_product_image',
  'anonymous visitors cannot use the file rule'
);

/* Alice, owner of Shop A: who may add files, and to which names */
reset role;
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9.webp'),
  true,
  'an owner may add a main photo file in her own shop folder'
);

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9_t.jpg'),
  true,
  'an owner may add a thumbnail file in her own shop folder'
);

select is(
  public.can_manage_product_image('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9.webp'),
  false,
  'an owner may not add files in the rival shop folder'
);

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/holiday.png'),
  false,
  'a file name that does not follow the pattern is refused'
);

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/extra/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9.webp'),
  false,
  'a file hidden in an extra folder is refused'
);

/* Alice registers her first photo */
select lives_ok(
  $$ select set_config('tests.c1', public.add_product_image(
       'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'webp', 1200, 900
     )::text, true) $$,
  'alice can register an uploaded photo'
);

select is(
  (select sort_order from public.product_images where id = current_setting('tests.c1')::uuid),
  1::smallint,
  'the first photo takes slot 1'
);

select is(
  (select byte_size from public.product_images where id = current_setting('tests.c1')::uuid),
  140000,
  'the stored size is the real size of both files'
);

select is(
  (select storage_path from public.product_images where id = current_setting('tests.c1')::uuid),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1.webp',
  'the file name is worked out by the database'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c7c7', 'webp', 800, 600) $$,
  '22023',
  'The photo was not uploaded',
  'a photo that was never uploaded cannot be registered'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'png', 800, 600) $$,
  '22023',
  'That photo type is not supported',
  'a photo type other than webp or jpg is refused'
);

select throws_ok(
  $$ insert into public.product_images (shop_id, product_id, sort_order, storage_path, width, height, byte_size)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 2, 'x', 10, 10, 10) $$,
  '42501',
  'permission denied for table product_images',
  'nobody can add a photo record directly'
);

select throws_ok(
  $$ delete from public.product_images where id = current_setting('tests.c1')::uuid $$,
  '42501',
  'permission denied for table product_images',
  'nobody can delete a photo record directly'
);

select throws_ok(
  $$ update public.product_images set sort_order = 4 where id = current_setting('tests.c1')::uuid $$,
  '42501',
  'permission denied for table product_images',
  'nobody can edit a photo record directly'
);

/* Carol, attendant at Shop A */
reset role;
select tests.authenticate_as('33333333-3333-3333-3333-333333333333');

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9.webp'),
  false,
  'an attendant may not add photo files'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'webp', 800, 600) $$,
  '42501',
  'Only owners and managers can change photos',
  'an attendant cannot register photos'
);

select is(
  (select count(*) from public.product_images where product_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1')::int,
  1,
  'an attendant can see the photo records of the shop'
);

select throws_ok(
  $$ select public.remove_product_image(current_setting('tests.c1')::uuid) $$,
  '42501',
  'Only owners and managers can change photos',
  'an attendant cannot remove photos'
);

/* Bob, owner of the rival Shop B */
reset role;
select tests.authenticate_as('44444444-4444-4444-4444-444444444444');

select is(
  public.can_manage_product_image('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9.webp'),
  false,
  'a rival owner may not add files to the shop folder'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'webp', 800, 600) $$,
  '42501',
  'Only owners and managers can change photos',
  'a rival owner cannot register photos on the product'
);

select is(
  (select count(*) from public.product_images where shop_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  0,
  'a rival owner cannot see the photo records'
);

select throws_ok(
  $$ select public.remove_product_image(current_setting('tests.c1')::uuid) $$,
  '42501',
  'Only owners and managers can change photos',
  'a rival owner cannot remove photos'
);

/* The administrator uploads three more photos, and alice registers them */
reset role;
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 120000, 20000);
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 120000, 20000);
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 120000, 20000);
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 120000, 20000);

select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'webp', 1200, 900),
            public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'webp', 1200, 900),
            public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'webp', 1200, 900) $$,
  'alice can register photos two, three and four'
);

select is(
  (select array_agg(sort_order::int order by sort_order) from public.product_images
    where product_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  array[1, 2, 3, 4],
  'the four photos fill slots 1 to 4'
);

select throws_ok(
  $$ select public.add_product_image('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'webp', 1200, 900) $$,
  '54000',
  'A product can have at most 4 photos',
  'a fifth photo is refused'
);

/* Removing a photo frees its slot */
select lives_ok(
  $$ select set_config('tests.removed', public.remove_product_image(
       (select id from public.product_images
         where product_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' and sort_order = 2)
     ), true) $$,
  'alice can remove the second photo'
);

select is(
  current_setting('tests.removed'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1/c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2.webp',
  'removing returns the file name so the app can delete the files'
);

select lives_ok(
  $$ select set_config('tests.c5', public.add_product_image(
       'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'webp', 1200, 900
     )::text, true) $$,
  'a new photo can be added after one was removed'
);

select is(
  (select sort_order from public.product_images where id = current_setting('tests.c5')::uuid),
  2::smallint,
  'the new photo fills the freed slot'
);

/* A product needs a photo to go live */
select throws_ok(
  $$ update public.products set status = 'active' where id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2' $$,
  '23514',
  'A product needs at least one photo to go live',
  'a product without photos cannot go live'
);

select lives_ok(
  $$ update public.products set status = 'active' where id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' $$,
  'a product with photos can go live'
);

select throws_ok(
  $$ select public.create_product('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Instant Live', 'clothes', 1000, null, 'active', '[{}]'::jsonb) $$,
  '23514',
  'A product needs at least one photo to go live',
  'a product cannot be created as live'
);

reset role;

select throws_ok(
  $$ insert into public.products (shop_id, category_code, name, price_minor, status)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'clothes', 'Admin Live', 1000, 'active') $$,
  '23514',
  'A product needs at least one photo to go live',
  'even an administrator cannot create a live product without photos'
);

/* A live product keeps its last photo */
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6', 120000, 20000);
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.add_product_image('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6', 'webp', 1200, 900);
     update public.products set status = 'active' where id = 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4' $$,
  'a product with one photo can go live'
);

select throws_ok(
  $$ select public.remove_product_image('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6') $$,
  '22023',
  'A live product needs at least one photo',
  'the last photo of a live product cannot be removed'
);

select lives_ok(
  $$ update public.products set status = 'draft' where id = 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4';
     select public.remove_product_image('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6') $$,
  'once the product is hidden, its last photo can be removed'
);

/* Storage cap per shop */
reset role;
select tests.upload('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 105000000, 20000);
select tests.authenticate_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.add_product_image('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 'webp', 1200, 900) $$,
  '54000',
  'Photo storage limit reached for this shop',
  'a shop cannot go over its photo storage limit'
);

select * from finish();

rollback;
