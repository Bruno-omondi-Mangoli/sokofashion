import type { ShopRole } from '@/features/shops/types';

export type InviteFormState = {
  error: string | null;
  notice: string | null;
};

export const initialInviteFormState: InviteFormState = {
  error: null,
  notice: null,
};

export const roleLabels: Record<ShopRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  attendant: 'Attendant',
};

export type PendingInvitation = {
  id: string;
  shopName: string;
  role: ShopRole;
};

export type TeamMember = {
  id: string;
  email: string;
  role: ShopRole;
  isActive: boolean;
};

export type ShopInvitation = {
  id: string;
  email: string;
  role: ShopRole;
  expiresAt: string;
};
