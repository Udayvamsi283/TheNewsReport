import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Post, IPost, PostFormat } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { Language } from '../models/language.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validator.js';
import { slugify } from '../utils/slugify.js';
import { sanitizeArticleHtml } from '../utils/sanitize.js';
import { logger } from '../utils/logger.js';
import { publishDueScheduledPosts } from '../services/scheduler.service.js';

/**
 * Generate a unique slug for a post, appending numeric suffix on conflict
 */
const generateUniqueSlug = async (baseText: string, currentId?: string): Promise<string> => {
  let baseSlug = slugify(baseText);
  if (!baseSlug) baseSlug = 'untitled-post';

  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Post.findOne({ slug: candidate });
    if (!existing || (currentId && existing._id.toString() === currentId)) {
      return candidate;
    }
    candidate = `${baseSlug}-${counter++}`;
  }
};

/**
 * GET /api/v1/posts (Admin & Public with filtering)
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    // Run any due scheduled posts check
    await publishDueScheduledPosts();

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    // Status filter
    const status = req.query.status as string;
    if (status && status !== 'all') {
      query.status = status;
    }

    // Format filter
    if (req.query.format && req.query.format !== 'all') {
      query.postFormat = req.query.format;
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Language filter
    if (req.query.language && req.query.language !== 'all') {
      query.language = req.query.language;
    }

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { slug: searchRegex }
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name email avatar')
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('tags', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve posts list'
    });
  }
};

/**
 * GET /api/v1/posts/:id (Admin get single post)
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('author', 'name email avatar')
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('tags', 'name slug');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error: any) {
    logger.error('Failed to get post by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve post'
    });
  }
};

/**
 * GET /api/v1/posts/preview/:tokenOrId (Secure preview for drafts and scheduled posts)
 */
export const getPostPreview = async (req: Request, res: Response) => {
  try {
    const tokenOrId = String(req.params.tokenOrId);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(tokenOrId);

    // Try finding by previewToken first, or by _id
    let post = await Post.findOne({
      $or: [
        { previewToken: tokenOrId },
        { _id: isValidObjectId ? tokenOrId : null }
      ]
    })
      .populate('author', 'name email avatar')
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('tags', 'name slug');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Preview not found or invalid preview token'
      });
    }

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error: any) {
    logger.error('Failed to preview post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate post preview'
    });
  }
};

/**
 * POST /api/v1/posts (Create post)
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const parsedData = createPostSchema.parse(req.body);

    // Auto-generate slug or sanitize custom slug
    const finalSlug = await generateUniqueSlug(parsedData.slug || parsedData.title);

    // Sanitize HTML content
    const sanitizedContent = sanitizeArticleHtml(parsedData.content || '');

    // Generate secure preview token
    const previewToken = crypto.randomUUID();

    // Handle publishing date
    let publishedAt: Date | undefined = undefined;
    if (parsedData.status === 'published') {
      publishedAt = new Date();
    }

    let scheduledAt: Date | undefined = undefined;
    if (parsedData.status === 'scheduled' && parsedData.scheduledAt) {
      scheduledAt = new Date(parsedData.scheduledAt);
    }

    const post = await Post.create({
      ...parsedData,
      slug: finalSlug,
      content: sanitizedContent,
      author: req.user?._id,
      publishedAt,
      scheduledAt,
      previewToken
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name email avatar')
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('tags', 'name slug');

    logger.info(`Post created [${post._id}] with format [${post.postFormat}] by ${req.user?._id}`);

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populated
    });
  } catch (error: any) {
    logger.error('Failed to create post:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
};

/**
 * PATCH /api/v1/posts/:id (Update post)
 */
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const parsedData = updatePostSchema.parse(req.body);

    // If slug is changed or title is changed without a slug
    if (parsedData.slug && parsedData.slug !== post.slug) {
      post.slug = await generateUniqueSlug(parsedData.slug, id);
    }

    // Sanitize content if provided
    if (parsedData.content !== undefined) {
      post.content = sanitizeArticleHtml(parsedData.content);
    }

    // Handle status transitions
    if (parsedData.status) {
      if (parsedData.status === 'published' && post.status !== 'published') {
        post.publishedAt = post.publishedAt || new Date();
      } else if (parsedData.status === 'scheduled') {
        if (parsedData.scheduledAt) {
          post.scheduledAt = new Date(parsedData.scheduledAt);
        }
      } else if (parsedData.status === 'draft') {
        // Unpublishing preserves publishedAt history or leaves it
      }
      post.status = parsedData.status;
    }

    // Update remaining allowed fields
    const directFields: (keyof typeof parsedData)[] = [
      'title', 'summary', 'category', 'tags', 'language', 'postFormat',
      'featuredImage', 'images', 'isFullWidth', 'registeredOnly', 'isFeatured', 'isBreaking', 'externalUrl',
      'seo', 'faq', 'translations', 'galleryItems', 'sortedListItems',
      'videoDetails', 'audioDetails', 'pollDetails', 'eventDetails'
    ];

    for (const field of directFields) {
      if (parsedData[field] !== undefined) {
        (post as any)[field] = parsedData[field];
      }
    }

    if (!post.previewToken) {
      post.previewToken = crypto.randomUUID();
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'name email avatar')
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('tags', 'name slug');

    logger.info(`Post updated [${post._id}] by ${req.user?._id}`);

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: populated
    });
  } catch (error: any) {
    logger.error('Failed to update post:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update post'
    });
  }
};

/**
 * DELETE /api/v1/posts/:id (Move to trash or permanent delete)
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (permanent || post.status === 'trashed') {
      await Post.findByIdAndDelete(id);
      logger.info(`Post permanently deleted [${id}] by ${req.user?._id}`);
      return res.status(200).json({
        success: true,
        message: 'Post permanently deleted'
      });
    } else {
      post.status = 'trashed';
      await post.save();
      logger.info(`Post moved to trash [${id}] by ${req.user?._id}`);
      return res.status(200).json({
        success: true,
        message: 'Post moved to trash',
        data: post
      });
    }
  } catch (error: any) {
    logger.error('Failed to delete post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

/**
 * POST /api/v1/posts/:id/restore (Restore post from trash to draft)
 */
export const restorePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.status = 'draft';
    await post.save();

    logger.info(`Post restored [${id}] by ${req.user?._id}`);

    return res.status(200).json({
      success: true,
      message: 'Post restored to drafts',
      data: post
    });
  } catch (error: any) {
    logger.error('Failed to restore post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore post'
    });
  }
};

/**
 * POST /api/v1/posts/:id/duplicate (Duplicate an existing post)
 */
export const duplicatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const original = await Post.findById(id).lean();

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    const newTitle = `${original.title} (Copy)`;
    const newSlug = await generateUniqueSlug(newTitle);

    const duplicateData: any = {
      ...original,
      _id: undefined,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      publishedAt: undefined,
      scheduledAt: undefined,
      previewToken: crypto.randomUUID(),
      author: req.user?._id,
      createdAt: undefined,
      updatedAt: undefined
    };

    const newPost = await Post.create(duplicateData);

    const populated = await Post.findById(newPost._id)
      .populate('author', 'name email avatar')
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('tags', 'name slug');

    logger.info(`Post duplicated from [${id}] to [${newPost._id}] by ${req.user?._id}`);

    return res.status(201).json({
      success: true,
      message: 'Post duplicated successfully as draft',
      data: populated
    });
  } catch (error: any) {
    logger.error('Failed to duplicate post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to duplicate post'
    });
  }
};

/**
 * POST /api/v1/posts/:id/publish (Quick publish)
 */
export const publishPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post published successfully',
      data: post
    });
  } catch (error: any) {
    logger.error('Failed to publish post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish post'
    });
  }
};

/**
 * POST /api/v1/posts/:id/unpublish (Quick unpublish)
 */
export const unpublishPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.status = 'draft';
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post unpublished and reverted to draft',
      data: post
    });
  } catch (error: any) {
    logger.error('Failed to unpublish post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unpublish post'
    });
  }
};

/**
 * POST /api/v1/posts/bulk-upload (CSV bulk upload foundation: validate, preview, and import)
 */
export const bulkUploadPosts = async (req: AuthRequest, res: Response) => {
  try {
    let rows: any[] = [];

    // Support either multipart CSV file or parsed JSON rows
    if (req.file) {
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/).filter((line: string) => line.trim().length > 0);

      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'CSV file must have a header row and at least one data row.'
        });
      }

      // Simple robust CSV header and line parsing
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^["']|["']$/g, ''));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          rowObj[header] = values[index] || '';
        });
        rows.push(rowObj);
      }
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a CSV file or rows array.'
      });
    }

    const action = req.body.action || 'preview'; // 'preview' or 'import'
    const targetStatus = req.body.targetStatus || 'draft'; // default to draft for editorial safety

    // Lookup default category and language for fallback
    const [defaultCat, defaultLang] = await Promise.all([
      Category.findOne({ status: 'active' }),
      Language.findOne({ isDefault: true }) || Language.findOne()
    ]);

    if (!defaultCat || !defaultLang) {
      return res.status(500).json({
        success: false,
        message: 'Categories and Languages must be seeded before bulk upload.'
      });
    }

    const validatedItems: any[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;

      if (!row.title || row.title.trim().length < 3) {
        errors.push({ row: rowNum, reason: 'Title is required (min 3 characters)' });
        continue;
      }

      // Category lookup
      let categoryId = defaultCat._id;
      if (row.category) {
        const foundCat = await Category.findOne({
          $or: [{ name: new RegExp(`^${row.category}$`, 'i') }, { slug: slugify(row.category) }]
        });
        if (foundCat) categoryId = foundCat._id;
      }

      // Format lookup
      const format: PostFormat = [
        'article', 'gallery', 'sorted_list', 'table_of_contents',
        'video', 'audio', 'poll', 'event'
      ].includes(row.postFormat?.toLowerCase())
        ? (row.postFormat.toLowerCase() as PostFormat)
        : 'article';

      const itemData = {
        title: row.title.trim(),
        summary: row.summary?.trim() || '',
        content: sanitizeArticleHtml(row.content || ''),
        category: categoryId,
        language: defaultLang._id,
        postFormat: format,
        status: targetStatus,
        isFullWidth: false,
        registeredOnly: false
      };

      validatedItems.push(itemData);
    }

    // If action is preview, return preview data and errors
    if (action === 'preview') {
      return res.status(200).json({
        success: true,
        preview: true,
        totalRows: rows.length,
        validCount: validatedItems.length,
        errorCount: errors.length,
        errors,
        sample: validatedItems.slice(0, 10)
      });
    }

    // Action is import: perform database insertion
    const createdPosts = [];
    for (const item of validatedItems) {
      const uniqueSlug = await generateUniqueSlug(item.title);
      const post = await Post.create({
        ...item,
        slug: uniqueSlug,
        author: req.user?._id,
        previewToken: crypto.randomUUID()
      });
      createdPosts.push(post);
    }

    logger.info(`Bulk import completed: ${createdPosts.length} posts created by ${req.user?._id}`);

    return res.status(201).json({
      success: true,
      importedCount: createdPosts.length,
      errorCount: errors.length,
      errors,
      message: `Successfully imported ${createdPosts.length} post(s) into ${targetStatus} status.`
    });
  } catch (error: any) {
    logger.error('Bulk upload failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Bulk upload process failed'
    });
  }
};

/**
 * GET /api/v1/posts/admin/stats (Real Admin Dashboard Statistics)
 */
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalUsers,
      totalComments,
      viewsAggregation,
      recentPosts,
      recentlyUpdatedPosts,
      mostViewedPosts
    ] = await Promise.all([
      Post.countDocuments({ status: { $ne: 'trashed' } }),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Post.countDocuments({ status: 'scheduled' }),
      User.countDocuments(),
      Comment.countDocuments({ status: { $ne: 'deleted' } }),
      Post.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Post.find({ status: { $ne: 'trashed' } })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('author', 'name email avatar')
        .populate('category', 'name slug')
        .select('title slug status postFormat views createdAt author category isFeatured isBreaking'),
      Post.find({ status: { $ne: 'trashed' } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('author', 'name')
        .select('title slug status updatedAt author'),
      Post.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .populate('category', 'name slug')
        .select('title slug views category publishedAt')
    ]);

    const totalViews = viewsAggregation[0]?.totalViews || 0;

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          totalPosts,
          published: publishedPosts,
          drafts: draftPosts,
          scheduled: scheduledPosts,
          users: totalUsers,
          comments: totalComments,
          views: totalViews
        },
        recentPosts,
        recentlyUpdated: recentlyUpdatedPosts,
        mostViewed: mostViewedPosts
      }
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics'
    });
  }
};

