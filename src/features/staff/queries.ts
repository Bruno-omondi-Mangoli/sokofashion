import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShopRole } from '@/features/shops/types';
import type { PendingInvitation, ShopInvitation, TeamMember } from './types';

type PendingInvitationRow = {
  invitation_id: string;
  shop_name: string;
  invited_role: ShopRole;
};

type TeamMemberRow = {
  member_id: string;
  member_email: string;
  member_role: ShopRole;
  member_active: boolean;
};

type ShopInvitationRow = {
  id: string;
  email: string;
  role: ShopRole;
  expires_at: string;
};

/* Open invitations for the logged in user. Empty unless their email is confirmed. */
export async function getMyPendingInvitations(
  supabase: SupabaseClient,
): Promise<PendingInvitation[]> {
  const { data, error } = await supabase.rpc('my_pending_invitations');

  if (error) {
    throw new Error(`Could not load invitations (${error.code})`);
  }

  return ((data ?? []) as PendingInvitationRow[]).map((row) => ({
    id: row.invitation_id,
    shopName: row.shop_name,
    role: row.invited_role,
  }));
}

/* The team of a shop, with emails. Only the owner is allowed to call this. */
export async function getTeam(supabase: SupabaseClient, shopId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase.rpc('list_shop_staff', {
    target_shop_id: shopId,
  });

  if (error) {
    throw new Error(`Could not load the team (${error.code})`);
  }

  return ((data ?? []) as TeamMemberRow[]).map((row) => ({
    id: row.member_id,
    email: row.member_email,
    role: row.member_role,
    isActive: row.member_active,
  }));
}

/* Pending invitations of a shop. Row Level Security shows them to the owner only. */
export async function getShopInvitations(
  supabase: SupabaseClient,
  shopId: string,
): Promise<ShopInvitation[]> {
  const { data, error } = await supabase
    .from('shop_invitations')
    .select('id, email, role, expires_at')
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at');

  if (error) {
    throw new Error(`Could not load invitations (${error.code})`);
  }

  return ((data ?? []) as ShopInvitationRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
  }));
}
