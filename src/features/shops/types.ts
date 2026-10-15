export type ShopFormState = {
  error: string | null;
};

export const initialShopFormState: ShopFormState = { error: null };

export type Country = {
  code: string;
  name: string;
};

export type ShopRole = 'owner' | 'manager' | 'attendant';

export type MyShop = {
  id: string;
  slug: string;
  name: string;
  role: ShopRole;
};
