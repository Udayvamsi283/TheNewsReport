import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().max(500).optional(),
  image: z.string().trim().optional(),
  parent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID').nullable().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateCategorySchema = createCategorySchema.partial();
