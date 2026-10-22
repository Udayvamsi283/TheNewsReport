import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
});

export const pollVoteSchema = z.object({
  optionId: z
    .string({ required_error: 'Option ID is required' })
    .trim()
    .min(1, 'Invalid option ID')
});

export const updatePreferencesSchema = z.object({
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  interests: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')).optional()
});
