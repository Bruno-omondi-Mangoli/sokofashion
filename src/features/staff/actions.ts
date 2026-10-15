'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createShopSchema } from '@/features/shops/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { inviteStaffSchema } from './schemas';
import type { InviteFormState } from './types';

const idSchema = z.uuid();
const slugSchema = createShopSchema.shape.slug;

/* Every action confirms the session with the Supabase server before doing anything */
async function requireSupabase() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/login');
  }
  return supabase;
}

function messageForInviteError(code: string | undefined): string {
  switch (code) {
    case '23505':
      return 'That email is already invited or already on your team.';
    case '54000':
      return 'Your team has reached the limit of 10 people.';
    case '42501':
      return 'Only the shop owner can invite staff.';
    case '22023':
      return 'Enter a valid email address.';
    default:
      return 'We could not save the invitation. Please try again.';
  }
}

export async function inviteStaffAction(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const parsed = inviteStaffSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });
  const shopId = idSchema.safeParse(formData.get('shopId'));
  const slug = slugSchema.safeParse(formData.get('slug'));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Check your details and try again',
      notice: null,
    };
  }
  if (!shopId.success || !slug.success) {
    return {
      error: 'Something went wrong. Reload the page and try again.',
      notice: null,
    };
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.rpc('invite_staff', {
    target_shop_id: shopId.data,
    invitee_email: parsed.data.email,
    invitee_role: parsed.data.role,
  });

  if (error) {
    console.error('invite_staff failed', { code: error.code });
    return { error: messageForInviteError(error.code), notice: null };
  }

  revalidatePath(`/dashboard/team/${slug.data}`);
  return {
    error: null,
    notice: `Invitation saved for ${parsed.data.email}. Ask them to sign up with this email and log in.`,
  };
}

export async function acceptInvitationAction(formData: FormData): Promise<void> {
  const invitationId = idSchema.safeParse(formData.get('invitationId'));
  if (!invitationId.success) {
    redirect('/dashboard?problem=invite');
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.rpc('accept_invitation', {
    target_invitation_id: invitationId.data,
  });

  if (error) {
    console.error('accept_invitation failed', { code: error.code });
    redirect('/dashboard?problem=invite');
  }

  redirect('/dashboard');
}

export async function cancelInvitationAction(formData: FormData): Promise<void> {
  const invitationId = idSchema.safeParse(formData.get('invitationId'));
  const slug = slugSchema.safeParse(formData.get('slug'));
  if (!invitationId.success || !slug.success) {
    redirect('/dashboard');
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.rpc('revoke_invitation', {
    target_invitation_id: invitationId.data,
  });

  if (error) {
    console.error('revoke_invitation failed', { code: error.code });
    redirect(`/dashboard/team/${slug.data}?problem=1`);
  }

  redirect(`/dashboard/team/${slug.data}`);
}

export async function setMemberActiveAction(formData: FormData): Promise<void> {
  const memberId = idSchema.safeParse(formData.get('memberId'));
  const slug = slugSchema.safeParse(formData.get('slug'));
  const makeActive = formData.get('active') === 'true';
  if (!memberId.success || !slug.success) {
    redirect('/dashboard');
  }

  const supabase = await requireSupabase();
  const { error } = await supabase.rpc('set_staff_member_active', {
    target_member_id: memberId.data,
    make_active: makeActive,
  });

  if (error) {
    console.error('set_staff_member_active failed', { code: error.code });
    redirect(`/dashboard/team/${slug.data}?problem=1`);
  }

  redirect(`/dashboard/team/${slug.data}`);
}
