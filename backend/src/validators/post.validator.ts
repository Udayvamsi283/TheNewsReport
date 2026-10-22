import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

const featuredImageSchema = z.object({
  url: z.string().url().or(z.literal('')),
  publicId: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional()
}).optional();

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  keywords: z.array(z.string()).optional()
}).optional();

const faqItemSchema = z.object({
  question: z.string().min(1, 'FAQ question is required'),
  answer: z.string().min(1, 'FAQ answer is required')
});

const translationSchema = z.object({
  language: objectIdSchema,
  languageCode: z.string().min(2).max(10),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().optional(),
  seo: seoSchema
});

const galleryItemSchema = z.object({
  image: z.string().min(1),
  publicId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().default(0)
});

const sortedListItemSchema = z.object({
  itemNumber: z.number().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  image: z.string().optional(),
  publicId: z.string().optional()
});

const videoDetailsSchema = z.object({
  videoUrl: z.string().min(1),
  embedUrl: z.string().optional(),
  provider: z.enum(['youtube', 'vimeo', 'direct', 'other']).optional(),
  duration: z.number().optional()
}).optional();

const audioDetailsSchema = z.object({
  audioUrl: z.string().min(1),
  coverImage: z.string().optional(),
  duration: z.number().optional(),
  artist: z.string().optional()
}).optional();

const pollOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  votes: z.number().optional()
});

const pollDetailsSchema = z.object({
  question: z.string().min(1),
  options: z.array(pollOptionSchema).min(2, 'A poll requires at least 2 options'),
  startTime: z.string().or(z.date()).optional(),
  endTime: z.string().or(z.date()).optional()
}).optional();

const eventDetailsSchema = z.object({
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  mapUrl: z.string().optional(),
  eventUrl: z.string().optional()
}).optional();

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  slug: z.string().optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().optional(),
  category: objectIdSchema,
  tags: z.array(objectIdSchema).optional().default([]),
  language: objectIdSchema,
  postFormat: z.enum([
    'article',
    'gallery',
    'sorted_list',
    'table_of_contents',
    'video',
    'audio',
    'poll',
    'event'
  ]).default('article'),
  featuredImage: featuredImageSchema,
  images: z.array(featuredImageSchema).optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'trashed']).default('draft'),
  scheduledAt: z.string().or(z.date()).optional(),
  isFullWidth: z.boolean().optional().default(false),
  registeredOnly: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isBreaking: z.boolean().optional().default(false),
  externalUrl: z.string().optional(),
  seo: seoSchema,
  faq: z.array(faqItemSchema).optional().default([]),
  translations: z.array(translationSchema).optional().default([]),
  galleryItems: z.array(galleryItemSchema).optional(),
  sortedListItems: z.array(sortedListItemSchema).optional(),
  videoDetails: videoDetailsSchema,
  audioDetails: audioDetailsSchema,
  pollDetails: pollDetailsSchema,
  eventDetails: eventDetailsSchema
});

export const updatePostSchema = createPostSchema.partial();
