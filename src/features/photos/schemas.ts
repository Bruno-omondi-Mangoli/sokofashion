import { z } from 'zod';
import { createShopSchema } from '@/features/shops/schemas';

const slug = createShopSchema.shape.slug;

/* What the browser tells the server after uploading a photo. The server never trusts a path from the browser. */
export const registerPhotoSchema = z.object({
  slug,
  productId: z.uuid(),
  imageId: z.uuid(),
  extension: z.enum(['webp', 'jpg']),
  width: z.number().int().min(1).max(4000),
  height: z.number().int().min(1).max(4000),
});

export const removePhotoSchema = z.object({
  slug,
  imageId: z.uuid(),
});

export const productStatusSchema = z.object({
  slug,
  productId: z.uuid(),
  status: z.enum(['active', 'draft']),
});
