import { z } from 'zod';
import { createProductPayloadSchema } from './schemas';

/* The edit rules are the add rules, so a product can never be edited into something that could not be added */
const fields = createProductPayloadSchema.shape;

export const updateProductSchema = z.object({
  slug: fields.slug,
  productId: z.uuid(),
  name: fields.name,
  category: fields.category,
  price: fields.price,
  description: fields.description,
});

export const archiveProductSchema = z.object({
  slug: fields.slug,
  productId: z.uuid(),
  archive: z.enum(['true', 'false']),
});
