import { z } from 'zod';

export const createLanguageSchema = z.object({
  name: z.string().trim().min(2).max(50),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2,5}(-[a-z0-9]+)?$/, 'Language code must be ISO format (e.g. en, hi, te)'),
  isDefault: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateLanguageSchema = createLanguageSchema.partial();
