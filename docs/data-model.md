# Data model reference

Updated with every migration. Money is stored as whole numbers in the smallest unit, with a currency code.

## countries

Reference data shared by all shops. Not tenant owned, so it has no shop_id.

- code: two letter country code, primary key
- name: country name
- currency_code: three letter currency code
- currency_minor_units: decimal places of the currency
- default_language: en or sw
- is_active: whether shops can be created in this country
- created_at: when the row was created

Row Level Security: everyone may read. Nobody may write through the public API.

## shops

One row per seller business. This is the tenant. Its id is the shop_id used by every shop owned table.

- id: unique identifier
- slug: the public link name, lowercase letters, numbers and single hyphens, 3 to 40 characters, unique
- name: display name
- country_code: links to countries
- currency_code: copied from the country at creation
- language: en or sw
- status: active or suspended
- created_by: the user who created it
- created_at, updated_at

Row Level Security: members can read their own shops. Owners can update name and language only. No direct insert or delete. Shops are created through the create_shop function.
Extra rules: the slug cannot be a reserved word such as admin, login or dashboard (constraint shops_slug_not_reserved). A user may create at most 3 shops, enforced inside create_shop, which serialises requests from the same user with an advisory lock.

## shop_members

Links a user to a shop with a role.

- id, shop_id, user_id
- role: owner, manager or attendant
- is_active: false means access revoked
- created_at
- one row per user per shop

Row Level Security: members can read the membership list of their own shops. Nobody can insert, update or delete through the public API yet.

## Helper functions

- is_shop_member(shop_id): true if the current user is an active member
- has_shop_role(shop_id, roles): true if the current user is an active member with one of those roles
- create_shop(name, slug, country_code): creates a shop and its owner membership together

## shop_invitations

An owner's invitation for an email address to join a shop as manager or attendant.

- id, shop_id
- email: lowercase, the person the invitation is for
- role: manager or attendant, never owner
- status: pending, accepted or revoked
- invited_by, accepted_by, created_at, expires_at (14 days), accepted_at
- one pending invitation per email per shop

Row Level Security: owners can read the invitations of their shop. Nobody can write directly. All changes go through functions.

## Team functions

- invite_staff(shop_id, email, role): owner only, at most 10 non-owner people per shop including pending invitations
- accept_invitation(invitation_id): the invited person, email must match and be confirmed
- revoke_invitation(invitation_id): owner only
- set_staff_member_active(member_id, make_active): owner only, owners cannot be deactivated
- list_shop_staff(shop_id): owner only, returns the team with emails
- my_pending_invitations(): the caller's open invitations, empty unless their email is confirmed
