export type ProductFormState = {
  error: string | null;
};

export const initialProductFormState: ProductFormState = { error: null };

export type ProductStatus = 'draft' | 'active' | 'archived';

export type Category = {
  code: string;
  name: string;
};

export type ShopCurrency = {
  currencyCode: string;
  minorUnits: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  categoryCode: string;
  priceMinor: number;
  currencyCode: string;
  status: ProductStatus;
  variantCount: number;
  totalOnHand: number;
};

export const statusLabels: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Live',
  archived: 'Archived',
};
