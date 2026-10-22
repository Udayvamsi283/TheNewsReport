import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().trim().min(2, 'Tag name must be at least 2 characters').max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be alphanumeric with hyphens')
    .optional()
});

export const updateTagSchema = createTagSchema.partial();
