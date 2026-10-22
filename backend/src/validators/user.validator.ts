import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  avatar: z.string().trim().url().or(z.literal('')).optional(),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  interests: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'disabled']).optional()
});
