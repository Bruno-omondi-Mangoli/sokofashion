/*
 * Staff invitations and team management.
 * shop_members still cannot be changed through the public API. Every change to
 * a team goes through the functions below, which check who is calling.
 */

create table public.shop_invitations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  email text not null
    check (
      email = lower(email)
      and length(email) between 5 and 254
      and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  role public.shop_role not null check (role in ('manager', 'attendant')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users (id) on delete set null,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz
);

/* Only one pending invitation per email per shop */
create unique index shop_invitations_one_pending_per_email
  on public.shop_invitations (shop_id, email)
  where status = 'pending';

create index shop_invitations_pending_email_idx
  on public.shop_invitations (email)
  where status = 'pending';

/* Owners may read the invitations of their own shop. Nobody may write directly. */
revoke all on table public.shop_invitations from anon, authenticated;
grant select on table public.shop_invitations to authenticated;

alter table public.shop_invitations enable row level security;

create policy "owners can read their shop invitations"
  on public.shop_invitations
  for select
  to authenticated
  using (public.has_shop_role(shop_id, array['owner']::public.shop_role[]));

/* Owner creates an invitation. */
create function public.invite_staff(
  target_shop_id uuid,
  invitee_email text,
  invitee_role public.shop_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_email text := lower(trim(invitee_email));
  staff_count integer;
  new_invitation_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be signed in' using errcode = '28000';
  end if;

  if not public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]) then
    raise exception 'Only the shop owner can do this' using errcode = '42501';
  end if;

  if invitee_role not in ('manager', 'attendant') then
    raise exception 'Staff can only be invited as manager or attendant' using errcode = '22023';
  end if;

  if clean_email is null
     or length(clean_email) > 254
     or clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;

  /* Two simultaneous invitations for one shop wait for each other */
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_shop_id::text));

  /* Old invitations that were never accepted are closed, so the email can be invited again */
  update public.shop_invitations
  set status = 'revoked'
  where shop_id = target_shop_id
    and email = clean_email
    and status = 'pending'
    and expires_at <= now();

  if exists (
    select 1
    from public.shop_members m
    join auth.users u on u.id = m.user_id
    where m.shop_id = target_shop_id
      and m.is_active
      and lower(u.email) = clean_email
  ) then
    raise exception 'That person is already on your team' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.shop_invitations i
    where i.shop_id = target_shop_id
      and i.email = clean_email
      and i.status = 'pending'
  ) then
    raise exception 'An invitation for this email is already pending' using errcode = '23505';
  end if;

  select
    (select count(*) from public.shop_members m
       where m.shop_id = target_shop_id and m.is_active and m.role <> 'owner')
    +
    (select count(*) from public.shop_invitations i
       where i.shop_id = target_shop_id and i.status = 'pending' and i.expires_at > now())
  into staff_count;

  if staff_count >= 10 then
    raise exception 'Your team has reached the limit of 10 people' using errcode = '54000';
  end if;

  insert into public.shop_invitations (shop_id, email, role, invited_by)
  values (target_shop_id, clean_email, invitee_role, current_user_id)
  returning id into new_invitation_id;

  return new_invitation_id;
end;
$$;

/*
 * The invited person accepts. The email must match and must be confirmed.
 * Every failure gives the same answer, so nobody can probe for invitations.
 */
create function public.accept_invitation(target_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  caller_email text;
  invitation public.shop_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in' using errcode = '28000';
  end if;

  select lower(u.email) into caller_email
  from auth.users u
  where u.id = current_user_id
    and u.email_confirmed_at is not null;

  select * into invitation
  from public.shop_invitations i
  where i.id = target_invitation_id
    and i.status = 'pending'
    and i.expires_at > now()
    and i.email = caller_email
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  /* A returning person is reactivated. An owner row is never touched. */
  insert into public.shop_members as sm (shop_id, user_id, role)
  values (invitation.shop_id, current_user_id, invitation.role)
  on conflict (shop_id, user_id)
  do update set role = excluded.role, is_active = true
  where sm.role <> 'owner';

  update public.shop_invitations
  set status = 'accepted', accepted_by = current_user_id, accepted_at = now()
  where id = invitation.id;

  return invitation.shop_id;
end;
$$;

/* Owner cancels a pending invitation. */
create function public.revoke_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_shop_id uuid;
begin
  select i.shop_id into invitation_shop_id
  from public.shop_invitations i
  where i.id = target_invitation_id
    and i.status = 'pending';

  if invitation_shop_id is null
     or not public.has_shop_role(invitation_shop_id, array['owner']::public.shop_role[]) then
    raise exception 'Only the shop owner can do this' using errcode = '42501';
  end if;

  update public.shop_invitations
  set status = 'revoked'
  where id = target_invitation_id;
end;
$$;

/* Owner switches a team member off or on. Owners themselves can never be switched off. */
create function public.set_staff_member_active(target_member_id uuid, make_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.shop_members%rowtype;
begin
  select * into target
  from public.shop_members m
  where m.id = target_member_id;

  if not found
     or not public.has_shop_role(target.shop_id, array['owner']::public.shop_role[]) then
    raise exception 'Only the shop owner can do this' using errcode = '42501';
  end if;

  if target.role = 'owner' then
    raise exception 'Owners cannot be deactivated' using errcode = '22023';
  end if;

  update public.shop_members
  set is_active = make_active
  where id = target_member_id;
end;
$$;

/* Owner reads the team with email addresses. Other people cannot. */
create function public.list_shop_staff(target_shop_id uuid)
returns table (
  member_id uuid,
  member_user_id uuid,
  member_email text,
  member_role public.shop_role,
  member_active boolean,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_shop_role(target_shop_id, array['owner']::public.shop_role[]) then
    raise exception 'Only the shop owner can do this' using errcode = '42501';
  end if;

  return query
  select m.id, m.user_id, u.email::text, m.role, m.is_active, m.created_at
  from public.shop_members m
  join auth.users u on u.id = m.user_id
  where m.shop_id = target_shop_id
  order by m.created_at;
end;
$$;

/* The current user's open invitations. Empty unless their email is confirmed. */
create function public.my_pending_invitations()
returns table (
  invitation_id uuid,
  shop_name text,
  invited_role public.shop_role,
  invited_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, s.name, i.role, i.created_at
  from public.shop_invitations i
  join public.shops s on s.id = i.shop_id
  join auth.users u on u.email is not null and lower(u.email) = i.email
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null
    and i.status = 'pending'
    and i.expires_at > now()
  order by i.created_at;
$$;

/* Only signed in users may call these functions */
revoke execute on function public.invite_staff(uuid, text, public.shop_role) from public, anon;
revoke execute on function public.accept_invitation(uuid) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.set_staff_member_active(uuid, boolean) from public, anon;
revoke execute on function public.list_shop_staff(uuid) from public, anon;
revoke execute on function public.my_pending_invitations() from public, anon;

grant execute on function public.invite_staff(uuid, text, public.shop_role) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.set_staff_member_active(uuid, boolean) to authenticated;
grant execute on function public.list_shop_staff(uuid) to authenticated;
grant execute on function public.my_pending_invitations() to authenticated;
